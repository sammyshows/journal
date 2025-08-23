import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  Alert,
  Dimensions,
  Platform,
  Keyboard,
  Easing
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as apiService from '../services/api';
import { useAppSettingsStore } from '../stores/useAppSettingsStore';
import { useJournalStore } from '../stores/useJournalStore';
import { useUserStore } from '../stores/useUserStore';
import { BlurView } from 'expo-blur';
import { deleteLocalEntry } from '../services/journalDatabase';
import { DateTimePicker } from '../components/DateTimePicker';

const EMOJI_LIST = [
  '😊', '😢', '😤', '😌', '💼', '❤️', '💪', '🍽️', '✈️', '📝',
  '🎉', '😴', '🤔', '😅', '🥳', '😰', '🤗', '😇', '🙃', '😎',
  '🌟', '🌈', '☀️', '🌙', '💫', '🔥', '💡', '🎨', '🎵', '📚',
  '🌸', '🍀', '🌊', '⭐', '💝', '🎯', '🚀', '🌺', '🍃', '💎'
];

export default function JournalEntryView() {
  const { theme } = useAppSettingsStore();
  const { currentUser } = useUserStore();
  const { getEntry, updateEntryInStore, fetchEntries } = useJournalStore();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDateTime, setShowEditDateTime] = useState(false);
  
  const titleInputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentSlideAnim = useRef(new Animated.Value(20)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.8)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entryId = params.id as string;
    if (entryId) {
      loadEntry(entryId);
    }
    
    // Simple fade in animation
    fadeAnim.setValue(0);
    contentSlideAnim.setValue(20);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentSlideAnim, {
        toValue: 0,
        duration: 400,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [params.id]);

  useEffect(() => {
    if (isEditMode && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditMode]);

  const loadEntry = async (entryId: string) => {
    try {
      const entry = await getEntry(entryId);
      if (entry) {
        setEntry(entry);
        setTempTitle(entry.title || '');
      }
    } catch (error) {
      console.error('Error loading entry:', error);
      Alert.alert('Error', 'Failed to load journal entry');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Save changes and exit edit mode
      handleSaveChanges();
    } else {
      // Enter edit mode
      setIsEditMode(true);
      setTempTitle(entry?.title || '');
    }
  };

  const handleSaveChanges = async () => {
    if (!entry || !currentUser) return;
    
    // Only update if title has changed
    if (tempTitle.trim() !== entry.title) {
      setHasChanges(true);
      const updatedEntry = { ...entry, title: tempTitle.trim() };
      setEntry(updatedEntry);
      
      try {
        await apiService.updateJournalEntry(
          entry.journal_entry_id,
          tempTitle.trim(),
          entry.emoji
        );
        updateEntryInStore(updatedEntry);
      } catch (error) {
        console.error('Error updating title:', error);
        Alert.alert('Error', 'Failed to update title');
        return; // Don't exit edit mode if save failed
      }
    }
    
    setIsEditMode(false);
    Keyboard.dismiss();
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setTempTitle(entry?.title || '');
    Keyboard.dismiss();
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (!entry || !currentUser) return;
    
    if (emoji !== entry.emoji) {
      setHasChanges(true);
      const updatedEntry = { ...entry, emoji };
      setEntry(updatedEntry);
      
      try {
        await apiService.updateJournalEntry(
          entry.journal_entry_id,
          entry.title,
          emoji
        );
        updateEntryInStore(updatedEntry);
      } catch (error) {
        console.error('Error updating emoji:', error);
        Alert.alert('Error', 'Failed to update emoji');
      }
    }
    handleModalDismiss();
  };

  const handleModalDismiss = () => {
    Animated.parallel([
      Animated.timing(modalScaleAnim, {
        toValue: 0.8,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowEmojiPicker(false);
    });
  };

  const handleEmojiPress = () => {
    // Enhanced emoji button animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 400,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Modal animation setup
    modalScaleAnim.setValue(0.8);
    modalOpacityAnim.setValue(0);
    
    setShowEmojiPicker(true);
    
    // Animate modal in
    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDeletePress = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entry || !currentUser) return;
    
    setIsDeleting(true);
    try {
      await deleteLocalEntry(entry.journal_entry_id);
      await apiService.deleteJournalEntry(entry.journal_entry_id)
      
      // Refetch entries to update the list
      await fetchEntries(currentUser.id);
      
      // Navigate back
      router.back();
    } catch (error) {
      console.error('Error deleting entry:', error);
      Alert.alert('Error', 'Failed to delete journal entry');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDateTimeUpdate = async (newDateTime: Date) => {
    if (!entry || !currentUser) return;
    
    try {
      setHasChanges(true);
      const updatedEntry = { 
        ...entry, 
        timestamp: newDateTime.toISOString() 
      };
      setEntry(updatedEntry);
      
      await apiService.updateJournalEntryDateTime(
        entry.journal_entry_id,
        newDateTime.toISOString()
      );
      
      updateEntryInStore(updatedEntry);
      setShowEditDateTime(false);
    } catch (error) {
      console.error('Error updating date/time:', error);
      Alert.alert('Error', 'Failed to update date and time');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    return `${day}/${month}/${year} at ${hours}:${minutes}${ampm}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.text, fontSize: 16 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.text, fontSize: 16 }}>Entry not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        {/* Header */}
        <Animated.View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          opacity: fadeAnim,
          transform: [{
            translateY: contentSlideAnim.interpolate({
              inputRange: [0, 50],
              outputRange: [0, -20],
            }),
          }],
        }}>
          <TouchableOpacity
            onPress={handleBack}
            style={{
              padding: 8,
              marginRight: 12,
              borderRadius: 20,
              backgroundColor: theme.surface,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.text,
            }}>
              {isEditMode ? 'Edit Entry' : 'Journal Entry'}
            </Text>
          </View>

          {isEditMode ? (
            <>
              <TouchableOpacity
                onPress={handleCancelEdit}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: theme.surface,
                  marginRight: 8,
                }}
              >
                <Ionicons name="close" size={20} color={theme.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveChanges}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: theme.primary,
                }}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleEditToggle}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: theme.surface,
                  marginRight: 8,
                }}
              >
                <Ionicons name="create-outline" size={20} color={theme.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeletePress}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: theme.surface,
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Emoji and Title Section */}
          <Animated.View style={{ 
            paddingHorizontal: 20, 
            paddingTop: 24,
            opacity: fadeAnim,
            transform: [{
              translateY: contentSlideAnim,
            }],
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginBottom: 24,
            }}>
              <Animated.View style={{ 
                transform: [{ scale: scaleAnim }],
                position: 'relative'
              }}>
                <TouchableOpacity
                  onPress={isEditMode ? handleEmojiPress : undefined}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: theme.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                    shadowColor: theme.border,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                    borderWidth: isEditMode ? 1 : 0,
                    borderColor: isEditMode ? `${theme.primary}60` : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{entry.emoji || '📝'}</Text>
                </TouchableOpacity>
                
                {isEditMode && (
                  <View style={{
                    position: 'absolute',
                    top: -2,
                    right: 16,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: theme.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Ionicons name="pencil" size={12} color="white" />
                  </View>
                )}
              </Animated.View>

              <View style={{ flex: 1, justifyContent: 'center' }}>
                {isEditMode ? (
                  <TextInput
                    ref={titleInputRef}
                    value={tempTitle}
                    onChangeText={setTempTitle}
                    maxLength={30}
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: theme.text,
                      backgroundColor: theme.surface,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: `${theme.primary}80`,
                      shadowColor: theme.border,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                    placeholder="Enter title..."
                    placeholderTextColor={theme.muted}
                    multiline
                  />
                ) : (
                  <View>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: theme.text,
                      lineHeight: 32,
                      marginBottom: 4,
                    }}>
                      {entry.title || 'Untitled Entry'}
                    </Text>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <Ionicons name="calendar-outline" size={14} color={theme.secondaryText} />
                      <Text style={{
                        fontSize: 12,
                        color: theme.secondaryText,
                        marginLeft: 6,
                      }}>
                        {formatDate(entry.timestamp)}
                      </Text>
                    </View>
                  </View>
                )}
                
                {isEditMode && (
                  <Text style={{
                    fontSize: 12,
                    color: theme.secondaryText,
                    marginTop: 4,
                    marginLeft: 16,
                  }}>
                    {tempTitle.length}/30 characters
                  </Text>
                )}
              </View>
            </View>

            {/* Date/Time Section - Only show in edit mode */}
            {isEditMode && (
              <View style={{
                marginBottom: 24,
              }}>
                <TouchableOpacity 
                  onPress={() => setShowEditDateTime(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.surface,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: `${theme.primary}70`,
                    shadowColor: theme.border,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <Ionicons name="calendar-outline" size={14} color={theme.primary} />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '500',
                    marginLeft: 12,
                    flex: 1,
                  }}>
                    {formatDate(entry.timestamp)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginBottom: 8,
              }}>
                {entry.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: theme.emotionTag,
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{
                      fontSize: 12,
                      color: theme.text,
                      fontWeight: '600',
                    }}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* AI Summary */}
            {entry.ai_summary && entry.content.length > 300 && (
              <View style={{
                backgroundColor: theme.highlight,
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.border,
              }}>
                <Text style={{
                  fontSize: 12,
                  color: theme.text,
                  lineHeight: 16,
                }}>
                  {entry.ai_summary}
                </Text>
              </View>
            )}

            {/* Full Entry Content */}
            <View style={{
              backgroundColor: theme.surface,
              borderRadius: 8,
              paddingHorizontal: 14,
              paddingVertical: 10,
              shadowColor: theme.border,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <Text style={{
                fontSize: 12,
                color: theme.text,
                lineHeight: 16,
              }}>
                {entry.content}
              </Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Emoji Picker Modal */}
        <Modal
          visible={showEmojiPicker}
          animationType="none"
          transparent
          onRequestClose={handleModalDismiss}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={handleModalDismiss}
          >
            <Animated.View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: modalOpacityAnim,
            }}>
              <BlurView
                intensity={100}
                tint={theme.name === 'dark' ? 'dark' : 'light'}
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <Animated.View
                style={{
                  transform: [{ scale: modalScaleAnim }],
                }}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: 20,
                    padding: 20,
                    margin: 20,
                    maxWidth: 320,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    elevation: 10,
                  }}
                >
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: theme.text,
                  textAlign: 'center',
                  marginBottom: 20,
                }}>
                  Choose an Emoji
                </Text>
                
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 12,
                }}>
                  {EMOJI_LIST.map((emoji, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleEmojiSelect(emoji)}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: entry.emoji === emoji ? theme.primary : theme.background,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteConfirm}
          animationType="fade"
          transparent
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}>
            <BlurView
              intensity={100}
              tint={theme.name === 'dark' ? 'dark' : 'light'}
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <View style={{
              backgroundColor: theme.surface,
              borderRadius: 20,
              padding: 24,
              maxWidth: 340,
              width: '100%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
            }}>
              <View style={{
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#fef2f2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Ionicons name="trash" size={24} color="#ef4444" />
                </View>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: theme.text,
                  textAlign: 'center',
                  marginBottom: 8,
                }}>
                  Delete Entry
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: theme.secondaryText,
                  textAlign: 'center',
                  lineHeight: 22,
                }}>
                  Are you sure you want to delete this journal entry? This action cannot be undone.
                </Text>
              </View>

              <View style={{
                flexDirection: 'row',
                gap: 12,
              }}>
                <TouchableOpacity
                  onPress={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    backgroundColor: theme.background,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                  disabled={isDeleting}
                >
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.text,
                    textAlign: 'center',
                  }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDeleteConfirm}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    backgroundColor: '#ef4444',
                    opacity: isDeleting ? 0.6 : 1,
                  }}
                  disabled={isDeleting}
                >
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#ffffff',
                    textAlign: 'center',
                  }}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Date Time Picker Modal */}
        {entry && (
          <DateTimePicker
            visible={showEditDateTime}
            onClose={() => setShowEditDateTime(false)}
            onConfirm={handleDateTimeUpdate}
            currentDateTime={new Date(entry.timestamp)}
            title="Edit Date & Time"
          />
        )}
      </SafeAreaView>
  );
}