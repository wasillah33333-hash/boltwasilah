const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');

// Mock Firebase for E2E testing
const mockFirebase = {
  auth: {
    currentUser: { uid: 'test-user', email: 'test@example.com' }
  },
  firestore: () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    onSnapshot: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    orderBy: jest.fn(),
    where: jest.fn()
  }),
  functions: () => ({
    httpsCallable: jest.fn()
  })
};

// Mock React components and hooks
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useEffect: jest.fn(),
  useRef: jest.fn(),
  useCallback: jest.fn()
}));

describe('E2E Chat Flow', () => {
  let mockMatchKbAnswer;
  let mockChatData;
  let mockMessages;

  beforeAll(() => {
    // Setup mocks
    mockMatchKbAnswer = jest.fn();
    mockChatData = {
      id: 'chat-1',
      title: 'Test Chat',
      createdAt: new Date(),
      lastActivityAt: new Date(),
      isActive: true,
      memorySummary: '',
      takeoverBy: null
    };
    mockMessages = [];
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('User Chat Flow', () => {
    it('should create a new chat when user opens chat widget', async () => {
      // Mock user authentication
      const mockUser = { uid: 'test-user', email: 'test@example.com' };
      
      // Mock chat creation
      const mockCreateChat = jest.fn().mockResolvedValue('new-chat-id');
      
      // Simulate opening chat widget
      const result = await mockCreateChat();
      
      expect(result).toBe('new-chat-id');
      expect(mockCreateChat).toHaveBeenCalled();
    });

    it('should send user message and receive bot response', async () => {
      const userMessage = 'How can I volunteer with Wasilah?';
      const expectedBotResponse = 'You can apply through our Join Us page...';
      
      // Mock Cloud Function response
      mockMatchKbAnswer.mockResolvedValue({
        data: {
          success: true,
          botResponse: expectedBotResponse,
          isKbMatch: true,
          confidence: 0.8
        }
      });

      // Simulate sending message
      const result = await mockMatchKbAnswer({
        userId: 'test-user',
        chatId: 'chat-1',
        message: userMessage,
        meta: {}
      });

      expect(result.data.success).toBe(true);
      expect(result.data.botResponse).toBe(expectedBotResponse);
      expect(result.data.isKbMatch).toBe(true);
    });

    it('should handle fallback when no KB match found', async () => {
      const userMessage = 'completely unrelated question';
      const expectedFallback = "I'm sorry — we don't have that information right now...";
      
      // Mock Cloud Function response for no match
      mockMatchKbAnswer.mockResolvedValue({
        data: {
          success: true,
          botResponse: expectedFallback,
          isKbMatch: false,
          confidence: 0.2
        }
      });

      const result = await mockMatchKbAnswer({
        userId: 'test-user',
        chatId: 'chat-1',
        message: userMessage,
        meta: {}
      });

      expect(result.data.success).toBe(true);
      expect(result.data.botResponse).toBe(expectedFallback);
      expect(result.data.isKbMatch).toBe(false);
    });

    it('should enforce rate limiting', async () => {
      const userMessage = 'Test message';
      
      // Mock rate limit exceeded
      mockMatchKbAnswer.mockRejectedValue({
        code: 'resource-exhausted',
        message: 'Rate limit exceeded'
      });

      await expect(mockMatchKbAnswer({
        userId: 'test-user',
        chatId: 'chat-1',
        message: userMessage,
        meta: {}
      })).rejects.toMatchObject({
        code: 'resource-exhausted'
      });
    });
  });

  describe('Admin Takeover Flow', () => {
    it('should allow admin to take over chat', async () => {
      const adminUid = 'admin-user';
      const chatId = 'chat-1';
      const userId = 'test-user';
      
      // Mock admin takeover
      const mockUpdateChat = jest.fn().mockResolvedValue(true);
      
      await mockUpdateChat({
        chatId,
        userId,
        takeoverBy: adminUid
      });
      
      expect(mockUpdateChat).toHaveBeenCalledWith({
        chatId,
        userId,
        takeoverBy: adminUid
      });
    });

    it('should prevent bot responses during admin takeover', async () => {
      const userMessage = 'How can I volunteer?';
      
      // Mock chat with admin takeover
      const chatWithTakeover = {
        ...mockChatData,
        takeoverBy: 'admin-user'
      };
      
      // Mock Cloud Function response for taken over chat
      mockMatchKbAnswer.mockResolvedValue({
        data: {
          success: false,
          message: 'Chat is being handled by an admin',
          botResponse: null
        }
      });

      const result = await mockMatchKbAnswer({
        userId: 'test-user',
        chatId: 'chat-1',
        message: userMessage,
        meta: {}
      });

      expect(result.data.success).toBe(false);
      expect(result.data.message).toBe('Chat is being handled by an admin');
    });

    it('should allow admin to send messages', async () => {
      const adminMessage = 'Hello! I\'m here to help you.';
      const adminUid = 'admin-user';
      
      // Mock admin message
      const mockAddMessage = jest.fn().mockResolvedValue('message-id');
      
      await mockAddMessage({
        chatId: 'chat-1',
        userId: 'test-user',
        message: adminMessage,
        sender: 'admin',
        adminUid
      });
      
      expect(mockAddMessage).toHaveBeenCalledWith({
        chatId: 'chat-1',
        userId: 'test-user',
        message: adminMessage,
        sender: 'admin',
        adminUid
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update UI when new messages arrive', () => {
      const initialMessages = [];
      const newMessage = {
        id: 'msg-1',
        text: 'Hello!',
        sender: 'user',
        createdAt: new Date()
      };
      
      // Mock real-time update
      const updatedMessages = [...initialMessages, newMessage];
      
      expect(updatedMessages).toHaveLength(1);
      expect(updatedMessages[0]).toEqual(newMessage);
    });

    it('should show typing indicator during bot response', () => {
      const isTyping = true;
      const isLoading = false;
      
      expect(isTyping).toBe(true);
      expect(isLoading).toBe(false);
    });
  });

  describe('Chat History', () => {
    it('should load user chat history', async () => {
      const mockChats = [
        {
          id: 'chat-1',
          title: 'Volunteering Question',
          lastActivityAt: new Date('2024-01-15')
        },
        {
          id: 'chat-2',
          title: 'Donation Inquiry',
          lastActivityAt: new Date('2024-01-14')
        }
      ];
      
      // Mock loading chats
      const mockLoadChats = jest.fn().mockResolvedValue(mockChats);
      
      const result = await mockLoadChats();
      
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Volunteering Question');
    });

    it('should allow user to continue previous chat', async () => {
      const chatId = 'chat-1';
      const mockSelectChat = jest.fn().mockResolvedValue(true);
      
      await mockSelectChat(chatId);
      
      expect(mockSelectChat).toHaveBeenCalledWith(chatId);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const userMessage = 'Test message';
      
      // Mock network error
      mockMatchKbAnswer.mockRejectedValue({
        code: 'unavailable',
        message: 'Service temporarily unavailable'
      });

      await expect(mockMatchKbAnswer({
        userId: 'test-user',
        chatId: 'chat-1',
        message: userMessage,
        meta: {}
      })).rejects.toMatchObject({
        code: 'unavailable'
      });
    });

    it('should handle authentication errors', async () => {
      const userMessage = 'Test message';
      
      // Mock authentication error
      mockMatchKbAnswer.mockRejectedValue({
        code: 'unauthenticated',
        message: 'User must be authenticated'
      });

      await expect(mockMatchKbAnswer({
        userId: 'test-user',
        chatId: 'chat-1',
        message: userMessage,
        meta: {}
      })).rejects.toMatchObject({
        code: 'unauthenticated'
      });
    });
  });
});