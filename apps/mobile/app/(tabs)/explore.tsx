import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService, SearchResponse } from '../../services/api';
import { useAppSettingsStore } from '../../stores/useAppSettingsStore';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function AssistantScreen() {
  const { theme } = useAppSettingsStore();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>Explore</Text>
          <Text style={{ fontSize: 14, color: theme.secondaryText, fontStyle: 'italic' }}>Ask anything!</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowSearchModal(true)}
            style={{ padding: 8, backgroundColor: theme.primary, borderRadius: 100 }}
          >
            <Ionicons name="search" size={20} color={theme.surface} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={clearChat}
            style={{ padding: 8, backgroundColor: theme.surface, borderRadius: 100 }}
          >
            <Ionicons name="refresh" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Message */}
        {messages.length === 0 && (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🤖</Text>
            <Text style={{ fontSize: 20, fontWeight: 'semibold', color: theme.text, marginBottom: 8 }}>
              Hey there! 👋
            </Text>
            <Text style={{ fontSize: 14, color: theme.secondaryText, textAlign: 'center', lineHeight: 20 }}>
              I'm your AI journaling companion. I'm here to help you reflect, explore your thoughts, and discover insights from your entries.
            </Text>
          </View>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <View
            key={message.id}
            style={{ marginBottom: 16, alignItems: message.role === 'user' ? 'flex-end' : 'flex-start' }}
          >
            <View
              style={{ maxWidth: '80%', padding: 16, borderRadius: 16, backgroundColor: message.role === 'user' ? theme.primary : theme.surface, borderWidth: 1, borderColor: theme.border }}
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
                style={{ fontSize: 16, lineHeight: 24, color: message.role === 'user' ? theme.surface : theme.text }}
              >
                {message.content}
              </Text>
              <Text
                style={{ fontSize: 12, marginTop: 4, color: message.role === 'user' ? theme.primary : theme.secondaryText }}
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
          <View style={{ alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ padding: 16, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}>
              <LoadingSpinner size="small" />
            </View>
          </View>
        )}

        {/* Starter Prompts */}
        {showStarterPrompts && messages.length === 0 && (
          <View style={{ paddingVertical: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'medium', color: theme.secondaryText, marginBottom: 16 }}>
              Try asking me about:
            </Text>
            <View className="space-y-3">
              {starterPrompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleStarterPrompt(prompt)}
                  style={{ padding: 10, margin: 2, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}
                >
                  <Text style={{ color: theme.text }}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Regenerate Button */}
        {messages.length > 0 && !isLoading && (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <TouchableOpacity
              onPress={regenerateLastResponse}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: theme.surface, borderRadius: 100 }}
            >
              <Ionicons name="refresh" size={16} color="#6b7280" />
              <Text style={{ fontSize: 16, color: theme.secondaryText, marginLeft: 8, fontWeight: 'medium' }}>Regenerate</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ paddingHorizontal: 16, paddingVertical: 16, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything about your journaling..."
              multiline
              maxLength={500}
              style={{ padding: 16, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, textAlignVertical: 'top' }}
              style={{ textAlignVertical: 'top' }}
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            style={{ padding: 16, borderRadius: 100, backgroundColor: inputText.trim() && !isLoading ? theme.primary : theme.surface }}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() && !isLoading ? theme.surface : theme.secondaryText}
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
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          {/* Search Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'semibold', color: theme.text }}>Search Memories</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 16 }}>
            {/* Search Input */}
            <View style={{ marginBottom: 16 }}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Ask about your past experiences..."
                style={{ padding: 16, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, textAlignVertical: 'top' }}
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
                style={{ marginTop: 12, padding: 16, borderRadius: 100, backgroundColor: searchQuery.trim() && !isSearching ? theme.primary : theme.surface }}
              >
                {isSearching ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  <Text
                    style={{ fontSize: 16, color: searchQuery.trim() ? theme.surface : theme.secondaryText, textAlign: 'center', fontWeight: 'medium' }}
                  >
                    Search Memories
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Search Suggestions */}
            {!searchResult && !isSearching && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 'medium', color: theme.secondaryText, marginBottom: 16 }}>
                  Try asking about:
                </Text>
                <View style={{ gap: 12 }}>
                  {searchSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSearchSuggestion(suggestion)}
                      style={{ padding: 16, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                    >
                      <Text style={{ fontSize: 16, color: theme.text }}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Search Results */}
            {searchResult && (
              <View style={{ gap: 16 }}>
                {/* AI Response */}
                <View style={{ padding: 16, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="bulb" size={20} color="#3b82f6" />
                    <Text style={{ fontSize: 16, color: theme.text, marginLeft: 8, fontWeight: 'medium' }}>AI Insights</Text>
                  </View>
                  <Text style={{ fontSize: 16, color: theme.text, lineHeight: 24 }}>
                    {searchResult.response}
                  </Text>
                </View>

                {/* Related Entries */}
                {searchResult.related_entries && searchResult.related_entries.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: 'medium', color: theme.secondaryText, marginBottom: 16 }}>
                      Related Memories ({searchResult.related_entries.length})
                    </Text>
                    <View style={{ gap: 16 }}>
                      {searchResult.related_entries.map((entry, index) => (
                        <View
                          key={entry.journal_entry_id}
                          style={{ padding: 16, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}
                          style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                            <Text style={{ fontSize: 14, color: theme.secondaryText }}>
                              {new Date(entry.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </Text>
                            <View style={{ padding: 4, borderRadius: 100, backgroundColor: theme.surface }}>
                              <Text style={{ fontSize: 12, color: theme.text, fontWeight: 'medium' }}>
                                {Math.round(entry.similarity_score * 100)}% match
                              </Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 16, color: theme.text, lineHeight: 24 }}>
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
                  <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'medium', color: theme.secondaryText, marginBottom: 8 }}>
                      No Related Memories Found
                    </Text>
                    <Text style={{ fontSize: 14, color: theme.secondaryText, textAlign: 'center' }}>
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