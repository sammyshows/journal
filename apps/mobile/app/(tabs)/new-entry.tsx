import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { VoiceMicButton } from '../../components/VoiceMicButton';
import { FloatingToggle } from '../../components/FloatingToggle';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService } from '../../services/api';

type Mode = 'text' | 'voice' | 'mixed';

export default function NewJournalEntry() {
  const [mode, setMode] = useState<Mode>('text');
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transcription, setTranscription] = useState('');
  const textInputRef = useRef<TextInput>(null);

  // useEffect(() => {
  //   // Auto-focus text input when in text mode
  //   if (mode === 'text' && textInputRef.current) {
  //     setTimeout(() => textInputRef.current?.focus(), 300);
  //   }
  // }, [mode]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === 'text') {
      setTranscription('');
    }
  };

  const handleVoicePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setTranscription('');
    // In a real app, this would start speech recognition
    console.log('Starting voice recording...');
    
    // Simulate live transcription
    setTimeout(() => {
      if (isRecording) {
        setIsTranscribing(true);
        simulateTranscription();
      }
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsTranscribing(false);
    console.log('Stopping voice recording...');
  };

  const simulateTranscription = () => {
    const sampleText = "Today was an amazing day. I felt so grateful for the beautiful weather and spent time with loved ones.";
    let currentText = '';
    
    const words = sampleText.split(' ');
    words.forEach((word, index) => {
      setTimeout(() => {
        currentText += (index > 0 ? ' ' : '') + word;
        setTranscription(currentText);
      }, index * 200);
    });
  };

  const handleSave = async () => {
    const finalContent = mode === 'voice' ? transcription : content;
    
    if (!finalContent.trim()) {
      Alert.alert('Empty Entry', 'Please write or record something before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await apiService.createJournalEntry(finalContent);
      
      Alert.alert(
        'Entry Saved!', 
        'Your journal entry has been saved and processed.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save your entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (content.trim() || transcription.trim()) {
      Alert.alert(
        'Discard Entry?',
        'You have unsaved changes. Are you sure you want to discard this entry?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={handleClose} className="p-2">
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
        
        <Text className="text-lg font-semibold text-gray-900">New Entry</Text>
        
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className={`px-4 py-2 rounded-full ${
            isSaving ? 'bg-gray-300' : 'bg-primary-500'
          }`}
        >
          {isSaving ? (
            <LoadingSpinner size="small" color="white" />
          ) : (
            <Text className="text-white font-medium">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Mode Toggle */}
      <View className="items-center py-4">
        <FloatingToggle currentMode={mode} onModeChange={handleModeChange} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6">
          {/* Text Mode */}
          {(mode === 'text' || mode === 'mixed') && (
            <View className="mb-6">
              <Text className="text-lg font-medium text-gray-700 mb-3">
                What's on your mind?
              </Text>
              <TextInput
                ref={textInputRef}
                value={content}
                onChangeText={setContent}
                placeholder="Start writing your thoughts..."
                multiline
                textAlignVertical="top"
                className="bg-white rounded-2xl p-4 min-h-[200px] text-base text-gray-900 border border-gray-100"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              />
            </View>
          )}

          {/* Voice Mode */}
          {(mode === 'voice' || mode === 'mixed') && (
            <View className="mb-6">
              <Text className="text-lg font-medium text-gray-700 mb-3">
                Voice Recording
              </Text>
              
              {/* Recording Status */}
              {isRecording && (
                <View className="bg-red-50 rounded-2xl p-4 mb-4 border border-red-100">
                  <View className="flex-row items-center mb-2">
                    <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                    <Text className="text-red-700 font-medium">Recording...</Text>
                  </View>
                  {isTranscribing && (
                    <Text className="text-sm text-red-600">
                      Live transcription in progress
                    </Text>
                  )}
                </View>
              )}

              {/* Transcription Area */}
              <View 
                className="bg-white rounded-2xl p-4 min-h-[150px] border border-gray-100 mb-6"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {transcription ? (
                  <Text className="text-base text-gray-900">
                    {transcription}
                  </Text>
                ) : (
                  <Text className="text-gray-400 italic">
                    {isRecording ? 'Listening...' : 'Press the mic button to start recording'}
                  </Text>
                )}
              </View>

              {/* Voice Button */}
              <View className="items-center">
                <VoiceMicButton
                  isRecording={isRecording}
                  onPress={handleVoicePress}
                  size="large"
                />
                <Text className="text-sm text-gray-500 mt-2">
                  {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
                </Text>
              </View>
            </View>
          )}

          {/* Tips */}
          <View className="bg-soft-50 rounded-2xl p-4 border border-soft-100">
            <Text className="text-soft-700 font-medium mb-2">💡 Tips for great entries:</Text>
            <Text className="text-soft-600 leading-5">
              • Write about your feelings and experiences{'\n'}
              • Be honest and authentic{'\n'}
              • Include what you're grateful for{'\n'}
              • Note any patterns or insights
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}