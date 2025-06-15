import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { EntryCard } from '../../components/EntryCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService, JournalEntry } from '../../services/api';

type DateFilter = 'week' | 'month' | 'year' | 'all';

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);

  const loadEntries = async () => {
    try {
      const data = await apiService.getJournalEntries();
      setEntries(data);
      setFilteredEntries(data);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [entries, dateFilter, searchQuery]);

  const filterEntries = () => {
    let filtered = [...entries];

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(entry => new Date(entry.created_at) >= filterDate);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(entry =>
        entry.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEntries(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEntries();
  };

  const handleEntryPress = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowEntryModal(true);
  };

  const handleNewEntry = () => {
    router.push('/journal/new');
  };

  const dateFilterOptions = [
    { key: 'all', label: 'All Time' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
  ];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">Journal</Text>
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              className="p-2 bg-white rounded-full shadow-sm"
            >
              <Ionicons name="search" size={20} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNewEntry}
              className="p-2 bg-primary-500 rounded-full shadow-sm"
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View className="mb-4">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search your entries..."
              className="bg-white rounded-xl px-4 py-3 text-base border border-gray-100"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            />
          </View>
        )}

        {/* Date Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row space-x-2">
            {dateFilterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => setDateFilter(option.key as DateFilter)}
                className={`px-4 py-2 rounded-full ${
                  dateFilter === option.key
                    ? 'bg-primary-500'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <Text
                  className={`font-medium ${
                    dateFilter === option.key ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Entries Grid */}
      <ScrollView
        className="flex-1 px-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredEntries.length > 0 ? (
          <View className="flex-row flex-wrap justify-between pb-6">
            {filteredEntries.map((entry) => (
              <View key={entry.journal_entry_id || entry.created_at} className="mb-4">
                <EntryCard
                  entry={entry}
                  onPress={() => handleEntryPress(entry)}
                  size="medium"
                />
              </View>
            ))}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-4xl mb-4">📔</Text>
            <Text className="text-lg font-medium text-gray-700 mb-2">
              {searchQuery ? 'No matching entries' : 'No entries yet'}
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              {searchQuery
                ? 'Try adjusting your search or date filter'
                : 'Start your journaling journey by creating your first entry'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                onPress={handleNewEntry}
                className="bg-primary-500 px-6 py-3 rounded-full shadow-lg"
              >
                <Text className="text-white font-medium">Create First Entry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Entry Detail Modal */}
      <Modal
        visible={showEntryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowEntryModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">Entry Details</Text>
            <TouchableOpacity>
              <Ionicons name="pencil" size={20} color="#ec8320" />
            </TouchableOpacity>
          </View>

          {selectedEntry && (
            <ScrollView className="flex-1 px-6 py-4">
              <View className="items-center mb-6">
                <Text className="text-4xl mb-2">📝</Text>
                <Text className="text-xl font-semibold text-gray-900 mb-2">
                  Journal Entry
                </Text>
                <Text className="text-gray-500">
                  {new Date(selectedEntry.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                <Text className="text-base text-gray-900 leading-6">
                  {selectedEntry.content}
                </Text>
              </View>

              {selectedEntry.metadata && (
                <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <Text className="text-blue-700 font-medium mb-1">Entry Details</Text>
                  <Text className="text-blue-600">
                    Created via: {selectedEntry.metadata.created_via || 'mobile_app'}
                  </Text>
                  {selectedEntry.metadata.message_count && (
                    <Text className="text-blue-600">
                      Messages: {selectedEntry.metadata.message_count}
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}