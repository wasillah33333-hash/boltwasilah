import React, { useEffect, useState } from 'react';
import { MessageCircle, Plus, Calendar, Clock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { Chat } from '../types/chat';

const ChatList = () => {
  const { user } = useAuth();
  const {
    chats,
    currentChat,
    isLoading,
    error,
    createNewChat,
    selectChat,
    loadChats,
    clearError
  } = useChat();
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user, loadChats]);

  const handleNewChat = async () => {
    try {
      await createNewChat();
    } catch (err) {
      console.error('Error creating new chat:', err);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-white to-cream-elegant flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-vibrant-orange mx-auto mb-4" />
          <h2 className="font-luxury-heading text-2xl text-black mb-2">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view your chat history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-white to-cream-elegant">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-luxury-heading text-4xl text-black mb-2">Your Chats</h1>
            <p className="text-gray-600">Continue your conversations with Wasilah Support</p>
          </div>
          <button
            onClick={handleNewChat}
            disabled={isLoading}
            className="bg-vibrant-orange text-white px-6 py-3 rounded-luxury font-luxury-semibold hover:bg-vibrant-orange-dark transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search your chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-3 border border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange font-luxury-body"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && chats.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your chats...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && chats.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-vibrant-orange mx-auto mb-4 opacity-50" />
            <h3 className="font-luxury-heading text-xl text-black mb-2">No Chats Yet</h3>
            <p className="text-gray-600 mb-6">Start a conversation with our support team!</p>
            <button
              onClick={handleNewChat}
              className="bg-vibrant-orange text-white px-6 py-3 rounded-luxury font-luxury-semibold hover:bg-vibrant-orange-dark transition-colors"
            >
              Start Your First Chat
            </button>
          </div>
        )}

        {/* Chat List */}
        {!isLoading && chats.length > 0 && (
          <div className="grid gap-4">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No chats match your search.</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  className={`luxury-card p-6 rounded-luxury-lg cursor-pointer transition-all duration-300 hover:shadow-luxury-lg ${
                    currentChat?.id === chat.id
                      ? 'bg-vibrant-orange text-white shadow-luxury-lg'
                      : 'bg-cream-white hover:bg-cream-elegant'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <MessageCircle className="w-5 h-5" />
                        <h3 className="font-luxury-heading text-lg">{chat.title}</h3>
                        {chat.takeoverBy && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      
                      {chat.memorySummary && (
                        <p className={`text-sm mb-3 ${
                          currentChat?.id === chat.id ? 'text-white/80' : 'text-gray-600'
                        }`}>
                          {chat.memorySummary.length > 100
                            ? chat.memorySummary.substring(0, 100) + '...'
                            : chat.memorySummary}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(chat.lastActivityAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(chat.lastActivityAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{chat.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;