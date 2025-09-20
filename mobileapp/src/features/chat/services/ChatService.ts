/**
 * Chat Service for AI interactions
 */

import { ChatMessage, ChatRequest } from '../types';

class ChatService {
  private apiUrl: string;

  constructor() {
    // In production, you'd use your actual AI service endpoint
    this.apiUrl = process.env.EXPO_PUBLIC_AI_CHAT_API || 'https://api.openai.com/v1/chat/completions';
  }

  // Send message to AI and get response
  async sendMessage(request: ChatRequest): Promise<string> {
    try {
      // Simulate AI response for demo purposes
      // In production, replace this with actual AI service call
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      
      const responses = this.getAIResponses(request.message.toLowerCase());
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      return randomResponse;
    } catch (error: any) {
      console.error('Chat service error:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  // Generate contextual AI responses based on user input
  private getAIResponses(message: string): string[] {
    // Wallet-related responses
    if (message.includes('balance') || message.includes('tokens')) {
      return [
        "I can help you check your token balances! You can view all your tokens on the Wallet tab, or pull down to refresh for the latest balances.",
        "Your wallet supports ETH, STRK, USDT, USDC, and WBTC. You can see real-time balances and USD values on your dashboard.",
        "To check your balance, go to the Wallet tab where you'll see all your tokens with current market prices."
      ];
    }

    if (message.includes('send') || message.includes('transfer')) {
      return [
        "To send tokens, go to the Send tab in the bottom navigation. You can select any supported token and enter the recipient's address.",
        "Sending tokens is easy! Use the Send tab to choose your token, enter the recipient address, and specify the amount. The app will handle the rest.",
        "You can send ETH, STRK, USDT, USDC, or WBTC to any valid Starknet address. Just use the Send tab and follow the prompts."
      ];
    }

    if (message.includes('swap') || message.includes('exchange')) {
      return [
        "Token swapping is available on the Swap tab! You can exchange between any of your supported tokens with real-time rates.",
        "Use the Swap tab to exchange tokens. Select your 'from' and 'to' tokens, enter the amount, and review the exchange rate before confirming.",
        "Swapping tokens is seamless with our integrated DEX. Check the Swap tab for current exchange rates and low fees."
      ];
    }

    if (message.includes('history') || message.includes('transaction')) {
      return [
        "You can view all your transactions in the History tab. Each transaction shows details like hash, amount, and status.",
        "Transaction history is available in the History tab. You can copy transaction hashes and view them in the Voyager explorer.",
        "Check the History tab to see all your wallet activity including sends, receives, swaps, and account deployment."
      ];
    }

    if (message.includes('address') || message.includes('wallet address')) {
      return [
        "Your wallet address is displayed on the dashboard. You can tap it to copy the full address to your clipboard.",
        "To share your wallet address, just tap on the shortened address shown on your dashboard - it will copy the full address.",
        "Your Starknet wallet address is shown at the top of your dashboard. Tap to copy and share with others for receiving tokens."
      ];
    }

    if (message.includes('security') || message.includes('private key') || message.includes('backup')) {
      return [
        "Your wallet is secured with biometric authentication and PIN protection. You can export your private key from Settings if needed.",
        "For security, your private key is stored securely on your device. Access it through Settings > Export Private Key with authentication.",
        "Your wallet uses industry-standard security with encrypted storage and biometric protection. Always keep your private key safe!"
      ];
    }

    if (message.includes('fee') || message.includes('gas') || message.includes('cost')) {
      return [
        "Transaction fees on Starknet are very low! Most transactions cost less than $0.01 thanks to the efficient network design.",
        "Gas fees are automatically calculated for each transaction. Starknet's design keeps fees minimal compared to other networks.",
        "Network fees are shown before you confirm any transaction. You can choose different speed options that affect the fee amount."
      ];
    }

    // General helpful responses
    return [
      "Hello! I'm here to help you with your Khalkos wallet. You can ask me about sending tokens, checking balances, transaction history, or any wallet features.",
      "I can assist you with wallet operations, transaction questions, or explain how to use any features in the app. What would you like to know?",
      "Feel free to ask me about your wallet, tokens, transactions, or how to use any of the features. I'm here to help!",
      "I can help you navigate your wallet, understand transactions, or answer questions about Starknet and your tokens. What can I help with?",
      "Ask me anything about your wallet! I can explain features, help with transactions, or provide guidance on using the app."
    ];
  }

  // Generate a unique message ID
  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create a chat message object
  createMessage(content: string, sender: 'user' | 'ai', type: 'text' | 'typing' = 'text'): ChatMessage {
    return {
      id: this.generateMessageId(),
      content,
      sender,
      timestamp: Date.now(),
      type
    };
  }

  // Get welcome message for new chat sessions
  getWelcomeMessage(): ChatMessage {
    return this.createMessage(
      "👋 Hi! I'm your Khalkos AI assistant. I can help you with wallet operations, answer questions about your tokens, explain features, or assist with transactions. How can I help you today?",
      'ai'
    );
  }
}

export default ChatService;
