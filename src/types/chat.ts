export interface Chat {
  id: string;
  title: string;
  createdAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
  memorySummary: string;
  takeoverBy?: string | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'admin';
  text: string;
  createdAt: Date;
  meta?: {
    isKbMatch?: boolean;
    confidence?: number;
    faqId?: string;
    [key: string]: any;
  };
}

export interface KbEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatAudit {
  id: string;
  actorUid: string;
  action: string;
  payload: any;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  isAdmin?: boolean;
  lastActive?: Date;
  unreadCount?: number;
}

export interface ChatContext {
  memorySummary: string;
  recentMessages: ChatMessage[];
}

export interface MatchResult {
  confidence: number;
  answer: string;
  faqId: string;
  question: string;
}

export interface BotResponse {
  success: boolean;
  message: string;
  botResponse?: string;
  isKbMatch?: boolean;
  confidence?: number;
}