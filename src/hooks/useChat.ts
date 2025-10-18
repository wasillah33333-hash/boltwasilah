import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Chat, ChatMessage, BotResponse } from '../types/chat';
import { chatCache } from '../utils/chatCache';

// Rate limiting
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_MESSAGES_PER_WINDOW = 5;

interface UseChatReturn {
  // State
  chats: Chat[];
  currentChat: Chat | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  
  // Actions
  createNewChat: () => Promise<string>;
  selectChat: (chatId: string) => void;
  sendMessage: (text: string, meta?: any) => Promise<void>;
  loadChats: () => Promise<void>;
  loadMessages: (chatId: string) => void;
  clearError: () => void;
}

export const useChat = (): UseChatReturn => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Rate limiting
  const rateLimitRef = useRef<{ count: number; resetTime: number }>({ count: 0, resetTime: 0 });
  
  // Cleanup refs
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Cloud Functions
  const matchKbAnswer = httpsCallable(functions, 'matchKbAnswer');
  
  // Check rate limit
  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    
    if (now > rateLimitRef.current.resetTime) {
      rateLimitRef.current = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
      return true;
    }
    
    if (rateLimitRef.current.count >= MAX_MESSAGES_PER_WINDOW) {
      setError('Rate limit exceeded. Please wait before sending another message.');
      return false;
    }
    
    rateLimitRef.current.count++;
    return true;
  }, []);
  
  // Create new chat
  const createNewChat = useCallback(async (): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      setError(null);
      
      const chatData = {
        title: 'New Chat',
        createdAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
        isActive: true,
        memorySummary: '',
        takeoverBy: null
      };
      
      const docRef = await addDoc(collection(db, `users/${user.uid}/chats`), chatData);
      
      // Load the new chat
      await loadChats();
      selectChat(docRef.id);
      
      return docRef.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create chat';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Select chat
  const selectChat = useCallback((chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
      
      // Cleanup previous listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      // Set up new listener
      unsubscribeRef.current = loadMessages(chatId);
    }
  }, [chats, loadMessages]);
  
  // Load chats with caching
  const loadChats = useCallback(async () => {
    if (!user) return;
    
    const cacheKey = `chats_${user.uid}`;
    
    // Check cache first
    const cachedChats = chatCache.get<Chat[]>(cacheKey);
    if (cachedChats) {
      setChats(cachedChats);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const chatsQuery = query(
        collection(db, `users/${user.uid}/chats`),
        orderBy('lastActivityAt', 'desc')
      );
      
      const snapshot = await getDocs(chatsQuery);
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastActivityAt: doc.data().lastActivityAt?.toDate() || new Date()
      })) as Chat[];
      
      setChats(chatsData);
      
      // Cache the result for 2 minutes
      chatCache.set(cacheKey, chatsData, 2 * 60 * 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chats';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Load messages for a chat - with unsubscribe cleanup
  const loadMessages = useCallback((chatId: string) => {
    if (!user) return;
    
    const messagesQuery = query(
      collection(db, `users/${user.uid}/chats/${chatId}/messages`),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as ChatMessage[];
      
      setMessages(messagesData);
    }, (err) => {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    });
    
    // Return unsubscribe function for cleanup
    return unsubscribe;
  }, [user]);
  
  // Send message
  const sendMessage = useCallback(async (text: string, meta?: any) => {
    if (!user || !currentChat) {
      setError('No active chat');
      return;
    }
    
    if (!text.trim()) {
      setError('Message cannot be empty');
      return;
    }
    
    if (!checkRateLimit()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setIsTyping(true);
      setError(null);
      
      // Call Cloud Function to get bot response
      const result = await matchKbAnswer({
        userId: user.uid,
        chatId: currentChat.id,
        message: text,
        meta: meta || {}
      }) as { data: BotResponse };
      
      if (result.data.success && result.data.botResponse) {
        // Update chat title if this is the first message
        if (messages.length === 0) {
          const newTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
          await updateDoc(doc(db, `users/${user.uid}/chats/${currentChat.id}`), {
            title: newTitle,
            lastActivityAt: serverTimestamp()
          });
        }
      }
      
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [user, currentChat, messages.length, matchKbAnswer, checkRateLimit]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Load chats on mount - only once per session
  useEffect(() => {
    if (user && chats.length === 0) {
      loadChats();
    }
  }, [user]); // Removed loadChats dependency to prevent re-loading

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);
  
  return {
    chats,
    currentChat,
    messages,
    isLoading,
    isTyping,
    error,
    createNewChat,
    selectChat,
    sendMessage,
    loadChats,
    loadMessages,
    clearError
  };
};