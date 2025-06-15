import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService, SearchResponse } from '../../services/api';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStarterPrompts, setShowStarterPrompts] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const starterPrompts = [
    "How can I be more consistent with journaling?",
    "What patterns do you notice in my entries?",
    "Help me reflect on my recent experiences",
    "What should I write about today?",
    "How can I better understand my emotions?"
  ];

  const searchSuggestions = [
    "When did I feel most confident?",
    "What are my thoughts about work?",
    "How do I handle stress?",
    "When was I happiest recently?",
    "What makes me feel grateful?"
  ];

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
      const response = await apiService.sendMessageToAssistant(content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
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

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchResult(null);

    try {
      const result = await apiService.searchEntries(query.trim());
      setSearchResult(result);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search entries. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-gray-900">AI Chat</Text>
          <Text className="text-gray-500">Chat & search your journal</Text>
        </View>
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => setShowSearchModal(true)}
            className="p-2 bg-blue-100 rounded-full"
          >
            <Ionicons name="search" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={clearChat}
            className="p-2 bg-gray-100 rounded-full"
          >
            <Ionicons name="refresh" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Message */}
        {messages.length === 0 && (
          <View className="py-8 items-center">
            <Text className="text-4xl mb-4">🤖</Text>
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              Hey there! 👋
            </Text>
            <Text className="text-gray-600 text-center leading-6">
              I'm your AI journaling companion. I'm here to help you reflect, explore your thoughts, and discover insights from your entries.
            </Text>
          </View>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <View
            key={message.id}
            className={`mb-4 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <View
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-primary-500 rounded-br-md'
                  : 'bg-white border border-gray-100 rounded-bl-md'
              }`}
              style={
                message.role === 'assistant'
                  ? {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }
                  : {}
              }
            >
              <Text
                className={`text-base leading-6 ${
                  message.role === 'user' ? 'text-white' : 'text-gray-900'
                }`}
              >
                {message.content}
              </Text>
              <Text
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-primary-100' : 'text-gray-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          </View>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <View className="items-start mb-4">
            <View className="bg-white p-4 rounded-2xl rounded-bl-md border border-gray-100">
              <LoadingSpinner size="small" />
            </View>
          </View>
        )}

        {/* Starter Prompts */}
        {showStarterPrompts && messages.length === 0 && (
          <View className="py-4">
            <Text className="text-lg font-medium text-gray-700 mb-4">
              Try asking me about:
            </Text>
            <View className="space-y-3">
              {starterPrompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleStarterPrompt(prompt)}
                  className="bg-white p-4 rounded-xl border border-gray-100 active:scale-95"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <Text className="text-gray-700">{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Regenerate Button */}
        {messages.length > 0 && !isLoading && (
          <View className="items-center py-4">
            <TouchableOpacity
              onPress={regenerateLastResponse}
              className="flex-row items-center px-4 py-2 bg-gray-100 rounded-full"
            >
              <Ionicons name="refresh" size={16} color="#6b7280" />
              <Text className="text-gray-600 ml-2 font-medium">Regenerate</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="bg-white border-t border-gray-100 px-6 py-4"
      >
        <View className="flex-row items-end space-x-3">
          <View className="flex-1">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything about your journaling..."
              multiline
              maxLength={500}
              className="bg-gray-100 rounded-2xl px-4 py-3 text-base max-h-32"
              style={{ textAlignVertical: 'top' }}
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            className={`p-3 rounded-full ${
              inputText.trim() && !isLoading
                ? 'bg-primary-500'
                : 'bg-gray-300'
            }`}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() && !isLoading ? 'white' : '#9ca3af'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          {/* Search Header */}
          <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">Search Memories</Text>
            <View className="w-6" />
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            {/* Search Input */}
            <View className="mb-6">
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Ask about your past experiences..."
                className="bg-white rounded-2xl px-4 py-4 text-base border border-gray-100"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
                multiline
                maxLength={200}
              />
              <TouchableOpacity
                onPress={() => handleSearch(searchQuery)}
                disabled={!searchQuery.trim() || isSearching}
                className={`mt-3 py-3 px-6 rounded-full ${
                  searchQuery.trim() && !isSearching
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}
              >
                {isSearching ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  <Text
                    className={`text-center font-medium ${
                      searchQuery.trim() ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    Search Memories
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Search Suggestions */}
            {!searchResult && !isSearching && (
              <View className="mb-6">
                <Text className="text-lg font-medium text-gray-700 mb-4">
                  Try asking about:
                </Text>
                <View className="space-y-3">
                  {searchSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSearchSuggestion(suggestion)}
                      className="bg-white p-4 rounded-xl border border-gray-100"
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                    >
                      <Text className="text-gray-700">{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Search Results */}
            {searchResult && (
              <View className="space-y-6">
                {/* AI Response */}
                <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="bulb" size={20} color="#3b82f6" />
                    <Text className="text-blue-800 font-medium ml-2">AI Insights</Text>
                  </View>
                  <Text className="text-blue-700 leading-6">
                    {searchResult.response}
                  </Text>
                </View>

                {/* Related Entries */}
                {searchResult.related_entries && searchResult.related_entries.length > 0 && (
                  <View>
                    <Text className="text-lg font-medium text-gray-700 mb-4">
                      Related Memories ({searchResult.related_entries.length})
                    </Text>
                    <View className="space-y-4">
                      {searchResult.related_entries.map((entry, index) => (
                        <View
                          key={entry.journal_entry_id}
                          className="bg-white rounded-2xl p-4 border border-gray-100"
                          style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
                          }}
                        >
                          <View className="flex-row items-start justify-between mb-3">
                            <Text className="text-sm text-gray-500">
                              {new Date(entry.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </Text>
                            <View className="bg-green-100 px-2 py-1 rounded-full">
                              <Text className="text-xs text-green-700 font-medium">
                                {Math.round(entry.similarity_score * 100)}% match
                              </Text>
                            </View>
                          </View>
                          <Text className="text-gray-900 leading-5">
                            {entry.content.length > 200 
                              ? entry.content.substring(0, 200) + '...'
                              : entry.content
                            }
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {searchResult.related_entries && searchResult.related_entries.length === 0 && (
                  <View className="text-center py-8">
                    <Text className="text-4xl mb-4">🔍</Text>
                    <Text className="text-lg font-medium text-gray-700 mb-2">
                      No Related Memories Found
                    </Text>
                    <Text className="text-gray-500 text-center">
                      Try searching for different emotions, events, or time periods.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}