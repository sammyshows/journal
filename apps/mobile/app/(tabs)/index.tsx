import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StreakCounter } from '../../components/StreakCounter';
import { EntryCard } from '../../components/EntryCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import * as apiService from '../../services/api';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { useUserStore } from '../../stores/useUserStore';

export default function HomeScreen() {
  const {theme} = useAppSettingsStore();

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
      <Text style={{ color: theme.text }}>Insightful stuff</Text>
    </SafeAreaView>
  );
}