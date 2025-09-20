/**
 * Chat feature type definitions
 */

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: number;
  type: 'text' | 'typing';
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}
