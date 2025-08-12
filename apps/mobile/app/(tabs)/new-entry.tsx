import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Keyboard, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { VoiceMicButton } from '../../components/VoiceMicButton';
import { FloatingToggle } from '../../components/FloatingToggle';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import * as apiService from '../../services/api';
import { addEntry } from '../../services/journalDatabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { useJournalStore } from '@/stores/useJournalStore';
import { useUserStore } from '../../stores/useUserStore';

type Mode = 'text' | 'voice' | 'mixed';

export default function NewJournalEntry() {
  const { theme } = useAppSettingsStore()
  const { currentUser } = useUserStore();
  const { fetchEntries } = useJournalStore();
  const [mode, setMode] = useState<Mode>('text');
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    const dimensionChangeListener = Dimensions.addEventListener('change', ({ window }) => {
      setScreenHeight(window.height);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
      dimensionChangeListener?.remove();
    };
  }, []);

  // Calculate dynamic max height for text input based on available space
  const calculateMaxTextInputHeight = () => {
    const headerHeight = 60; // Approximate header height
    const modeToggleHeight = 50; // Approximate toggle height
    const questionTextHeight = 40; // "What's on your mind?" text
    const bottomPadding = 50; // Safety padding
    const voiceButtonHeight = mode === 'voice' ? 120 : 0; // Voice button space when visible
    
    const availableHeight = screenHeight - keyboardHeight - headerHeight - modeToggleHeight - questionTextHeight - bottomPadding - voiceButtonHeight;
    return keyboardHeight > 0 ? Math.min(availableHeight, 300) : availableHeight;
  };

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
        <TouchableOpacity onPress={handleClose} style={{ padding: 8, width: 60 }}>
          <Ionicons name="close" size={24} color={theme.secondaryText} />
        </TouchableOpacity>
        
        <Text style={{ fontSize: 16, fontWeight: 'semibold', color: theme.secondaryText }}>New Entry</Text>
        
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{ alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: isSaving || !content.length ? theme.border : '#22c55e' }}
        >
          {isSaving ? (
            <LoadingSpinner size="small" color="white" />
          ) : (
            <Text style={{ color: theme.surface, fontSize: 12, fontWeight: 'medium' }}>Save</Text>
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
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '300', color: theme.text, marginTop: 12, marginBottom: 12 }}>
              What's on your mind?
            </Text>
            <TextInput
              ref={textInputRef}
              value={content}
              onChangeText={setContent}
              placeholder="Start writing your thoughts..."
              placeholderTextColor={theme.muted}
              multiline
              textAlignVertical="top"
              scrollEnabled={true}
              style={{
                backgroundColor: theme.surface,
                borderRadius: 16,
                padding: 16,
                minHeight: 200,
                maxHeight: calculateMaxTextInputHeight(),
                fontSize: 13,
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

          {mode === 'voice' && (
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <VoiceMicButton
                isRecording={isRecording}
                onPress={handleVoicePress}
                size="medium"
              />
              <Text style={{ color: theme.text, fontSize: 14, marginTop: 8 }}>
                {isRecording
                  ? isTranscribing
                    ? 'Transcribing...'
                    : 'Recording...'
                  : 'Tap to start recording'}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}