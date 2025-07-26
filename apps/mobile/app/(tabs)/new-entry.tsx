import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { VoiceMicButton } from '../../components/VoiceMicButton';
import { FloatingToggle } from '../../components/FloatingToggle';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService } from '../../services/api';
import { addEntry } from '../../services/journalDatabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { useJournalStore } from '@/stores/useJournalStore';
import { useUserStore } from '../../stores/useUserStore';

type Mode = 'text' | 'voice' | 'mixed';

export default function NewJournalEntry() {
  const { theme } = useAppSettingsStore()
  const { currentUser, loadUserFromStorage } = useUserStore();
  const { fetchEntries } = useJournalStore();
  const [mode, setMode] = useState<Mode>('text');
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transcription, setTranscription] = useState('');
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

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

    const journal_entry_id = uuidv4();

    saveToLocalDatabase(journal_entry_id, finalContent);

    saveOnline(journal_entry_id, finalContent);

    setIsSaving(false);
  };

  const saveToLocalDatabase = async (journal_entry_id: string, content: string) => {
    try {
      await addEntry({
        journal_entry_id,
        userId: currentUser.id,
        content
      });

      Alert.alert(
        'Entry Saved!', 
        'Your journal entry has been saved and processed.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)/journal')
          }
        ]
      );
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save your entry. Please try again.');
    }
  };

  const saveOnline = async (journal_entry_id: string, content: string) => {
    try {
      await apiService.createJournalEntry(journal_entry_id, content, currentUser.id);
      await fetchEntries(currentUser.id);
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  }

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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 }}>
        <TouchableOpacity onPress={handleClose} style={{ padding: 8 }}>
          <Ionicons name="close" size={24} color={theme.secondaryText} />
        </TouchableOpacity>
        
        <Text style={{ fontSize: 16, fontWeight: 'semibold', color: theme.secondaryText }}>New Entry</Text>
        
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: isSaving ? theme.border : theme.primary }}
        >
          {isSaving ? (
            <LoadingSpinner size="small" color="white" />
          ) : (
            <Text style={{ color: theme.surface, fontSize: 16, fontWeight: 'medium' }}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Mode Toggle */}
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <FloatingToggle currentMode={mode} onModeChange={handleModeChange} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
          {/* Text Mode */}
          {(mode === 'text' || mode === 'mixed') && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: 'medium', color: theme.text, marginBottom: 8 }}>
                What's on your mind?
              </Text>
              <TextInput
                ref={textInputRef}
                value={content}
                onChangeText={setContent}
                placeholder="Start writing your thoughts..."
                multiline
                textAlignVertical="top"
                style={{
                  backgroundColor: theme.surface,
                  borderRadius: 16,
                  padding: 16,
                  minHeight: 200,
                  fontSize: 16,
                  color: theme.text,
                  borderWidth: 1,
                  borderColor: theme.border,
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
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: 'medium', color: theme.text, marginBottom: 8 }}>
                Voice Recording
              </Text>
              
              {/* Recording Status */}
              {isRecording && (
                <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: theme.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ width: 12, height: 12, backgroundColor: theme.primary, borderRadius: 16, marginRight: 8 }} />
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'medium' }}>Recording...</Text>
                  </View>
                  {isTranscribing && (
                    <Text style={{ color: theme.text, fontSize: 14 }}>
                      Live transcription in progress
                    </Text>
                  )}
                </View>
              )}

              {/* Transcription Area */}
              <View 
                style={{
                  backgroundColor: theme.surface,
                  borderRadius: 16,
                  padding: 16,
                  minHeight: 150,
                  borderWidth: 1,
                  borderColor: theme.border,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {transcription ? (
                  <Text style={{ color: theme.text, fontSize: 16 }}>
                    {transcription}
                  </Text>
                ) : (
                  <Text style={{ color: theme.text, fontSize: 16, fontStyle: 'italic' }}>
                    {isRecording ? 'Listening...' : 'Press the mic button to start recording'}
                  </Text>
                )}
              </View>

              {/* Voice Button */}
              <View style={{ alignItems: 'center' }}>
                <VoiceMicButton
                  isRecording={isRecording}
                  onPress={handleVoicePress}
                  size="large"
                />
                <Text style={{ color: theme.text, fontSize: 14, marginTop: 8 }}>
                  {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
                </Text>
              </View>
            </View>
          )}

          {/* Tips */}
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'medium', marginBottom: 8 }}>💡 Tips for great entries:</Text>
            <Text style={{ color: theme.text, fontSize: 14, marginBottom: 8 }}>
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