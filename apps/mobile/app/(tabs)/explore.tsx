import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService, ExploreResponse, ExploreMessage, JournalEntryCard } from '../../services/api';
import { useAppSettingsStore } from '../../stores/useAppSettingsStore';
import { useUserStore } from '../../stores/useUserStore';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'fallback' | 'insight';
  entries?: JournalEntryCard[];
}

export default function AssistantScreen() {
  const { theme } = useAppSettingsStore();
  const { currentUser, loadUserFromStorage } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStarterPrompts, setShowStarterPrompts] = useState(true);
  const [currentThinkingMessage, setCurrentThinkingMessage] = useState('');
  const [thinkingMessageIndex, setThinkingMessageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const thinkingMessages = [
    "Looking through your journal…",
    "Finding the moments that matter most…",
    "Reading what you've shared before…",
    "Connecting your experiences…",
    "Gathering your thoughts…"
  ];

  const starterPrompts = [
    "What patterns do you notice in my mood lately?",
    "Help me understand my relationship with work",
    "What am I avoiding in my life right now?"
  ];

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      setCurrentThinkingMessage(thinkingMessages[0]);
      setThinkingMessageIndex(0);
      
      interval = setInterval(() => {
        setThinkingMessageIndex(prev => {
          const nextIndex = (prev + 1) % thinkingMessages.length;
          setCurrentThinkingMessage(thinkingMessages[nextIndex]);
          return nextIndex;
        });
      }, 2500);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const animateCardIn = () => {
    slideAnim.setValue(50);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setShowStarterPrompts(false);
    setIsLoading(true);

    try {
      // Build chat history for context
      const chatHistory: ExploreMessage[] = [
        ...messages.map(msg => ({
          role: msg.role === 'assistant' ? 'ai' as const : msg.role,
          content: msg.content
        })),
        { role: 'user', content }
      ];

      const response = await apiService.sendMessageToExplore(chatHistory, currentUser.id);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.reply,
        role: 'assistant',
        timestamp: new Date(),
        type: response.type,
        entries: response.entries
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.entries?.length) {
        animateCardIn();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    sendMessage(inputText);
  };

  const handleStarterPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive', 
          onPress: () => {
            setMessages([]);
            setShowStarterPrompts(true);
          }
        }
      ]
    );
  };

  const regenerateLastResponse = () => {
    if (messages.length < 2) return;
    
    const lastUserMessage = messages[messages.length - 2];
    if (lastUserMessage.role === 'user') {
      setMessages(prev => prev.slice(0, -1));
      sendMessage(lastUserMessage.content);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      {messages.length && (
        <View className="flex-row justify-between items-center px-4 py-4 border-b" style={{ borderColor: theme.border }}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/journal')}
            className="p-2 rounded-full bg-surface shadow-sm"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2
            }}
          >
            <Ionicons name="arrow-back" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text style={{ fontSize: 24, fontWeight: '200', color: theme.text }}>Explore</Text>
          </View>
          <TouchableOpacity
            onPress={clearChat}
            className="p-2 rounded-full bg-surface shadow-sm" 
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}
            >
            <Ionicons name="refresh" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>
      )}

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
      >
        {/* Welcome Message */}
        {messages.length === 0 && (
          <View style={{ flex: 1 }} className="pt-16 px-4 items-center justify-start">
            <Text className="font-medium text-4xl mb-2" style={{ color: theme.text }}>
              Ask <Text style={{ color: theme.primary }}>anything</Text>, what would you like to explore?
            </Text>
          </View>
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <View key={message.id} className="pb-6">
            {message.role === 'user' ? (
              <View className="items-end">
                <View 
                  className="max-w-[85%] px-4 py-3 rounded-2xl"
                  style={{ 
                    backgroundColor: theme.primary,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2
                  }}
                >
                  <Text className="text-sm leading-5" style={{ color: theme.surface }}>
                    {message.content}
                  </Text>
                  <Text className="text-xs mt-1 opacity-80" style={{ color: theme.surface }}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ) : (
              <View className="items-start">             
                <View 
                  className="max-w-[85%] px-4 py-3 rounded-2xl"
                  style={{ 
                    backgroundColor: theme.surface,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: theme.name === 'dark' ? 0.3 : 0.08,
                    shadowRadius: 8,
                    elevation: 4,
                    borderWidth: theme.name === 'dark' ? 1 : 0,
                    borderColor: theme.border
                  }}
                >
                  <Text className="text-sm leading-5" style={{ color: theme.text }}>
                    {message.content}
                  </Text>
                  <Text className="text-xs mt-2" style={{ color: theme.secondaryText }}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {message.entries?.length && (
                  <Text className="text-sm my-3 px-1" style={{ color: theme.secondaryText }}>
                    These journal entries are related to what you're feeling.
                  </Text>
                )}

                {/* Journal Entry Cards */}
                {message.entries?.length && (
                  <Animated.View 
                    className="w-full"
                    style={{ transform: [{ translateY: slideAnim }] }}
                  >
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      className="pl-1"
                      contentContainerStyle={{ paddingRight: 16 }}
                    >
                      {message.entries.map((entry, cardIndex) => (
                        <TouchableOpacity
                          key={entry.id}
                          className="mr-3 p-4 rounded-2xl"
                          style={{
                            backgroundColor: theme.surface,
                            width: 280,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: theme.name === 'dark' ? 0.4 : 0.12,
                            shadowRadius: 12,
                            elevation: 6,
                            borderWidth: theme.name === 'dark' ? 1 : 0,
                            borderColor: theme.border
                          }}
                          onPress={() => {
                            // TODO: Navigate to full journal entry
                            Alert.alert('Journal Entry', `Would open entry: ${entry.title}`);
                          }}
                        >
                          <View className="flex-row items-center mb-2">
                            <Text className="text-2xl mr-2">{entry.emoji}</Text>
                            <Text className="flex-1 text-base font-semibold" style={{ color: theme.text }}>
                              {entry.title}
                            </Text>
                          </View>
                          <Text className="text-sm leading-5 mb-3" style={{ color: theme.secondaryText }}>
                            {entry.summary}
                          </Text>
                          <Text className="text-xs" style={{ color: theme.muted }}>
                            {entry.date}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </Animated.View>
                )}
              </View>
            )}
          </View>
        ))}

        {/* Thinking Messages */}
        {isLoading && (
          <View className="items-start mb-6">
            <Animated.View 
              className="px-4 py-3 rounded-2xl flex-row items-center"
              style={{ 
                backgroundColor: theme.surface,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: theme.name === 'dark' ? 0.3 : 0.08,
                shadowRadius: 8,
                elevation: 4,
                borderWidth: theme.name === 'dark' ? 1 : 0,
                borderColor: theme.border,
                opacity: fadeAnim
              }}
            >
              <LoadingSpinner size="small" color={theme.primary} />
              <Text className="ml-3 text-sm" style={{ color: theme.secondaryText }}>
                {currentThinkingMessage}
              </Text>
            </Animated.View>
          </View>
        )}

        {/* Starter Prompts */}
        {showStarterPrompts && messages.length === 0 && (
          <View className="pt-10 px-4">
            <View className="space-y-6">
              {starterPrompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleStarterPrompt(prompt)}
                  className="py-2 px-4 rounded-2xl"
                  style={{
                    backgroundColor: theme.emotionTag,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    elevation: 3,
                    marginBottom: 8
                  }}
                >
                  <Text className="text-sm leading-6" style={{ color: theme.text }}>
                    {prompt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Regenerate Button */}
        {/* {messages.length > 0 && !isLoading && (
          <View className="items-center pt-4 pb-6">
            <TouchableOpacity
              onPress={regenerateLastResponse}
              className="flex-row items-center px-6 py-3 rounded-full"
              style={{
                backgroundColor: theme.surface,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: theme.name === 'dark' ? 0.2 : 0.05,
                shadowRadius: 6,
                elevation: 3,
                borderWidth: theme.name === 'dark' ? 1 : 0,
                borderColor: theme.border
              }}
            >
              <Ionicons name="refresh" size={16} color={theme.secondaryText} />
              <Text className="text-sm font-medium ml-2" style={{ color: theme.secondaryText }}>
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        )} */}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="px-4 pb-4 mb-6"
      >
        <View className="flex-row items-center">
          <View className="flex-1 mr-3">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="What's on your mind?"
              placeholderTextColor={theme.muted}
              multiline
              maxLength={500}
              className="p-4 rounded-2xl text-base placeholder:text-gray-400"
              style={{
                color: theme.text,
                textAlignVertical: 'top',
                minHeight: 48,
                maxHeight: 120,
                shadowRadius: 4,
                elevation: 2,
                borderWidth: 2,
                borderColor: theme.border
              }}
              editable={!isLoading}
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{
              backgroundColor: inputText.trim() && !isLoading ? theme.primary : theme.border,
              shadowColor: inputText.trim() && !isLoading ? theme.primary : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: inputText.trim() && !isLoading ? 0.3 : 0.1,
              shadowRadius: 4,
              elevation: 3
            }}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() && !isLoading ? theme.surface : theme.secondaryText}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}