import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Search, 
  Users, 
  MessageSquare, 
  Send, 
  ToggleLeft, 
  ToggleRight,
  Clock,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where, 
  updateDoc, 
  doc, 
  addDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Chat, ChatMessage, User as UserType } from '../../types/chat';

const ChatsPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [adminMessage, setAdminMessage] = useState('');
  const [isTakeover, setIsTakeover] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const matchKbAnswer = httpsCallable(functions, 'matchKbAnswer');

  // Check if user is admin
  const isAdmin = user?.uid && users.find(u => u.id === user.uid)?.isAdmin;

  useEffect(() => {
    if (!isAdmin) return;
    
    // Load all users
    loadUsers();
  }, [isAdmin]);

  useEffect(() => {
    if (selectedUser) {
      loadUserChats(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedChat && selectedUser) {
      loadChatMessages(selectedUser.id, selectedChat.id);
      setIsTakeover(!!selectedChat.takeoverBy);
    }
  }, [selectedChat, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('lastActive', 'desc')
      );
      
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastActive: doc.data().lastActive?.toDate() || new Date()
      })) as UserType[];
      
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserChats = async (userId: string) => {
    try {
      const chatsQuery = query(
        collection(db, `users/${userId}/chats`),
        orderBy('lastActivityAt', 'desc')
      );
      
      const snapshot = await getDocs(chatsQuery);
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastActivityAt: doc.data().lastActivityAt?.toDate() || new Date()
      })) as Chat[];
      
      setUserChats(chatsData);
    } catch (err) {
      console.error('Error loading user chats:', err);
      setError('Failed to load chats');
    }
  };

  const loadChatMessages = (userId: string, chatId: string) => {
    const messagesQuery = query(
      collection(db, `users/${userId}/chats/${chatId}/messages`),
      orderBy('createdAt', 'asc')
    );
    
    return onSnapshot(messagesQuery, (snapshot) => {
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
  };

  const handleTakeoverToggle = async () => {
    if (!selectedChat || !selectedUser) return;
    
    try {
      const chatRef = doc(db, `users/${selectedUser.id}/chats/${selectedChat.id}`);
      const newTakeoverBy = isTakeover ? null : user?.uid;
      
      await updateDoc(chatRef, {
        takeoverBy: newTakeoverBy,
        lastActivityAt: serverTimestamp()
      });
      
      setIsTakeover(!isTakeover);
      
      // Log audit
      await addDoc(collection(db, 'chats_audit'), {
        actorUid: user?.uid,
        action: isTakeover ? 'takeover_released' : 'takeover_started',
        payload: {
          chatId: selectedChat.id,
          userId: selectedUser.id,
          takeoverBy: newTakeoverBy
        },
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating takeover:', err);
      setError('Failed to update takeover status');
    }
  };

  const handleSendAdminMessage = async () => {
    if (!adminMessage.trim() || !selectedChat || !selectedUser) return;
    
    try {
      // Add admin message to chat
      await addDoc(collection(db, `users/${selectedUser.id}/chats/${selectedChat.id}/messages`), {
        sender: 'admin',
        text: adminMessage,
        createdAt: serverTimestamp(),
        meta: {
          adminUid: user?.uid,
          adminName: user?.displayName || 'Admin'
        }
      });
      
      // Update chat last activity
      await updateDoc(doc(db, `users/${selectedUser.id}/chats/${selectedChat.id}`), {
        lastActivityAt: serverTimestamp()
      });
      
      // Log audit
      await addDoc(collection(db, 'chats_audit'), {
        actorUid: user?.uid,
        action: 'admin_message_sent',
        payload: {
          chatId: selectedChat.id,
          userId: selectedUser.id,
          message: adminMessage
        },
        createdAt: serverTimestamp()
      });
      
      setAdminMessage('');
    } catch (err) {
      console.error('Error sending admin message:', err);
      setError('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAdminMessage();
    }
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <div
      key={message.id}
      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] p-3 rounded-luxury ${
          message.sender === 'user'
            ? 'bg-vibrant-orange text-white'
            : message.sender === 'admin'
            ? 'bg-blue-500 text-white'
            : 'bg-cream-elegant text-black'
        }`}
      >
        <p className="text-sm font-luxury-body">{message.text}</p>
        <p className={`text-xs mt-1 ${
          message.sender === 'user' || message.sender === 'admin' 
            ? 'text-white/70' 
            : 'text-gray-500'
        }`}>
          {formatTime(message.createdAt)}
          {message.sender === 'admin' && ' (Admin)'}
        </p>
        {message.meta?.isKbMatch && (
          <p className="text-xs mt-1 text-green-600">
            ✓ Knowledge Base Answer
          </p>
        )}
      </div>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-white to-cream-elegant flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="font-luxury-heading text-2xl text-black mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-white to-cream-elegant">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-luxury-heading text-4xl text-black mb-2">Chat Management</h1>
          <p className="text-gray-600">Manage user chats and provide support</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Users List */}
          <div className="bg-cream-white rounded-luxury-lg shadow-luxury p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-luxury-heading text-lg text-black flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Users
              </h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left p-3 rounded-luxury transition-colors ${
                    selectedUser?.id === user.id
                      ? 'bg-vibrant-orange text-white'
                      : 'bg-cream-elegant hover:bg-vibrant-orange/10 text-black'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-luxury-semibold text-sm">{user.displayName || 'Unknown User'}</p>
                      <p className="text-xs opacity-70">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs">{formatDate(user.lastActive || new Date())}</p>
                      {user.unreadCount && user.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {user.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* User Chats */}
          <div className="bg-cream-white rounded-luxury-lg shadow-luxury p-6">
            <h3 className="font-luxury-heading text-lg text-black mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              {selectedUser ? `${selectedUser.displayName}'s Chats` : 'Select a User'}
            </h3>
            
            {selectedUser ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {userChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full text-left p-3 rounded-luxury transition-colors ${
                      selectedChat?.id === chat.id
                        ? 'bg-vibrant-orange text-white'
                        : 'bg-cream-elegant hover:bg-vibrant-orange/10 text-black'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-luxury-semibold text-sm">{chat.title}</p>
                        <p className="text-xs opacity-70">{formatDate(chat.lastActivityAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs">{formatTime(chat.lastActivityAt)}</p>
                        {chat.takeoverBy && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Select a user to view their chats</p>
            )}
          </div>

          {/* Chat Transcript */}
          <div className="bg-cream-white rounded-luxury-lg shadow-luxury p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-luxury-heading text-lg text-black flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat Transcript
              </h3>
              {selectedChat && (
                <button
                  onClick={handleTakeoverToggle}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-luxury text-sm font-luxury-semibold transition-colors ${
                    isTakeover
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isTakeover ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>Release</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>Takeover</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {selectedChat ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No messages yet</p>
                  ) : (
                    messages.map(renderMessage)
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Admin Input */}
                <div className="border-t pt-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={adminMessage}
                      onChange={(e) => setAdminMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange text-sm"
                    />
                    <button
                      onClick={handleSendAdminMessage}
                      disabled={!adminMessage.trim()}
                      className="bg-vibrant-orange text-white p-2 rounded-luxury hover:bg-vibrant-orange-dark transition-colors disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">Select a chat to view messages</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatsPanel;