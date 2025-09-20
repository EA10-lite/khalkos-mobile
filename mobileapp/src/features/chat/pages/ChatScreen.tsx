import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatService from '../services/ChatService';
import { ChatMessage } from '../types';

const ChatScreen = () => {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const chatService = new ChatService();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Add welcome message when component mounts
    const welcomeMessage = chatService.getWelcomeMessage();
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = chatService.createMessage(inputText.trim(), 'user');
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Add typing indicator
      const typingMessage = chatService.createMessage('...', 'ai', 'typing');
      setMessages([...newMessages, typingMessage]);

      // Get AI response
      const response = await chatService.sendMessage({
        message: userMessage.content,
        conversationHistory: newMessages
      });

      // Remove typing indicator and add actual response
      const aiMessage = chatService.createMessage(response, 'ai');
      setMessages([...newMessages, aiMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = chatService.createMessage(
        "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        'ai'
      );
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    return (
      <MessageBubble 
        message={item} 
        isTyping={item.type === 'typing'}
      />
    );
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View 
        className="px-6 pb-4 bg-white border-b border-gray-100"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
            <MaterialCommunityIcons name="robot" size={24} color="#3B82F6" />
          </View>
          <View>
            <Text className="text-xl font-bold text-black">Khalkos AI</Text>
            <Text className="text-sm text-gray-600">Your wallet assistant</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Area */}
      <View 
        className="px-4 pt-4 pb-3 bg-white border-t border-gray-100"
      >
        <View className="flex-row items-end gap-3">
          <View className="flex-1 max-h-32 min-h-12 bg-gray-100 rounded-2xl px-4 py-3">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything about your wallet..."
              placeholderTextColor="#9CA3AF"
              multiline
              className="text-base text-black flex-1"
              style={{ minHeight: 28 }}
            />
          </View>
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              inputText.trim() && !isLoading ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <MaterialCommunityIcons 
              name="send" 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// Message Bubble Component
type MessageBubbleProps = {
  message: ChatMessage;
  isTyping?: boolean;
};

const MessageBubble = ({ message, isTyping = false }: MessageBubbleProps) => {
  const isUser = message.sender === 'user';
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <View className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
      <View className="flex-row items-end gap-2 max-w-[80%]">
        {!isUser && (
          <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mb-1">
            <MaterialCommunityIcons name="robot" size={16} color="#3B82F6" />
          </View>
        )}
        
        <View>
          <View 
            className={`px-4 py-3 rounded-2xl ${
              isUser 
                ? 'bg-primary rounded-br-md' 
                : 'bg-gray-100 rounded-bl-md'
            }`}
          >
            {isTyping ? (
              <TypingIndicator />
            ) : (
              <Text 
                className={`text-base ${
                  isUser ? 'text-white' : 'text-black'
                }`}
              >
                {message.content}
              </Text>
            )}
          </View>
          
          <Text 
            className={`text-xs text-gray-500 mt-1 ${
              isUser ? 'text-right' : 'text-left'
            }`}
          >
            {formatTime(message.timestamp)}
          </Text>
        </View>

        {isUser && (
          <View className="w-8 h-8 bg-primary rounded-full items-center justify-center mb-1">
            <MaterialCommunityIcons name="account" size={16} color="white" />
          </View>
        )}
      </View>
    </View>
  );
};

// Typing Indicator Component
const TypingIndicator = () => {
  const [dots, setDots] = useState<string>('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="flex-row items-center gap-1">
      <Text className="text-gray-600">AI is typing</Text>
      <Text className="text-gray-600 w-6">{dots}</Text>
    </View>
  );
};

export default ChatScreen;
