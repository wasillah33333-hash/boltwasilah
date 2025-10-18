import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Plus, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from '../types/chat';

const ChatWidget = () => {
  const { user } = useAuth();
  const {
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
    clearError
  } = useChat();
  
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showChatList, setShowChatList] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Only show for authenticated users
  if (!user) {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !currentChat && chats.length === 0) {
      // Auto-create first chat when opening
      createNewChat();
    }
  }, [isOpen, currentChat, chats.length, createNewChat]);

  useEffect(() => {
    if (isOpen) {
      // Scroll widget into view
      if (widgetRef.current) {
        widgetRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentChat) return;

    try {
      await sendMessage(inputText);
      setInputText('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = async () => {
    try {
      await createNewChat();
      setShowChatList(false);
    } catch (err) {
      console.error('Error creating new chat:', err);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-[calc(50%-100px)] z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-vibrant-orange to-vibrant-orange-light text-white w-16 h-16 rounded-full shadow-luxury-glow flex items-center justify-center hover:scale-110 transition-all duration-300 animate-pulse"
        >
          <MessageCircle className="w-8 h-8" />
        </button>
      </div>

      {/* Chat Widget */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={widgetRef}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-md h-[90vh] max-h-[600px] luxury-card bg-cream-white rounded-luxury-lg shadow-luxury-lg overflow-hidden flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-vibrant-orange to-vibrant-orange-light text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-luxury-heading text-lg">Wasilah Support</h3>
                  <p className="text-sm opacity-90">We're here to help!</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowChatList(!showChatList)}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                  title="Chat History"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat List Sidebar */}
            {showChatList && (
              <div className="w-64 bg-cream-elegant border-r border-vibrant-orange/20 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-luxury-heading text-lg text-black">Your Chats</h4>
                  <button
                    onClick={handleNewChat}
                    className="bg-vibrant-orange text-white p-2 rounded-luxury hover:bg-vibrant-orange-dark transition-colors"
                    title="New Chat"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        selectChat(chat.id);
                        setShowChatList(false);
                      }}
                      className={`w-full text-left p-3 rounded-luxury transition-colors ${
                        currentChat?.id === chat.id
                          ? 'bg-vibrant-orange text-white'
                          : 'bg-white hover:bg-vibrant-orange/10 text-black'
                      }`}
                    >
                      <p className="font-luxury-semibold text-sm truncate">{chat.title}</p>
                      <p className="text-xs opacity-70">
                        {chat.lastActivityAt.toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 m-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-700">{error}</p>
                    <button
                      onClick={clearError}
                      className="ml-auto text-red-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && currentChat && (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-luxury-body">Start a conversation!</p>
                    <p className="text-sm">Ask me anything about Wasilah's programs and services.</p>
                  </div>
                )}
                
                {messages.map(renderMessage)}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-cream-elegant text-black p-3 rounded-luxury">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-vibrant-orange rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-vibrant-orange rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-vibrant-orange rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-cream-elegant">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading || isTyping}
                    className="flex-1 px-4 py-2 border border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange font-luxury-body disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isLoading || isTyping}
                    className="bg-vibrant-orange text-white p-2 rounded-luxury hover:bg-vibrant-orange-dark transition-colors disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ChatWidget;