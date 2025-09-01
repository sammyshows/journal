import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { errorLogger, ErrorLog } from '../services/errorLogger';

export default function DebugLogs() {
  const { theme } = useAppSettingsStore();
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = () => {
    setLogs(errorLogger.getLogs());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadLogs();
    setRefreshing(false);
  };

  const clearLogs = () => {
    errorLogger.clearLogs();
    loadLogs();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#ef4444';
      case 'warn': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return theme.text;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.border
      }}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ padding: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <Text style={{ 
          fontSize: 16, 
          fontWeight: 'semibold', 
          color: theme.text 
        }}>
          Debug Logs
        </Text>
        
        <TouchableOpacity
          onPress={clearLogs}
          style={{ 
            paddingHorizontal: 12, 
            paddingVertical: 6, 
            borderRadius: 8, 
            backgroundColor: theme.surface
          }}
        >
          <Text style={{ color: theme.text, fontSize: 12 }}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Logs List */}
      <ScrollView 
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ padding: 16 }}>
          {logs.length === 0 ? (
            <Text style={{ 
              color: theme.muted, 
              textAlign: 'center', 
              marginTop: 40,
              fontSize: 14
            }}>
              No logs yet
            </Text>
          ) : (
            logs.map((log) => (
              <View 
                key={log.id} 
                style={{ 
                  marginBottom: 12,
                  padding: 12,
                  backgroundColor: theme.surface,
                  borderRadius: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: getLevelColor(log.level)
                }}
              >
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4
                }}>
                  <Text style={{ 
                    fontSize: 10, 
                    color: getLevelColor(log.level),
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {log.level}
                  </Text>
                  <Text style={{ 
                    fontSize: 10, 
                    color: theme.muted
                  }}>
                    {formatTimestamp(log.timestamp)}
                  </Text>
                </View>
                
                {log.context && (
                  <Text style={{ 
                    fontSize: 10, 
                    color: theme.muted,
                    marginBottom: 4,
                    fontWeight: '500'
                  }}>
                    [{log.context}]
                  </Text>
                )}
                
                <Text style={{ 
                  fontSize: 11, 
                  color: theme.text,
                  lineHeight: 16
                }}>
                  {log.message}
                </Text>
                
                {log.stack && (
                  <Text style={{ 
                    fontSize: 9, 
                    color: theme.muted,
                    marginTop: 6,
                    fontFamily: 'monospace'
                  }}>
                    {log.stack}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Stats Footer */}
      <View style={{ 
        padding: 16, 
        borderTopWidth: 1, 
        borderTopColor: theme.border 
      }}>
        <Text style={{ 
          fontSize: 10, 
          color: theme.muted, 
          textAlign: 'center' 
        }}>
          {logs.length} logs • Pull to refresh
        </Text>
      </View>
    </SafeAreaView>
  );
}