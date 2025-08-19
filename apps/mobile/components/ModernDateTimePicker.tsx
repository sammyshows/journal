import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettingsStore } from '../stores/useAppSettingsStore';

interface ModernDateTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (datetime: Date) => void;
  currentDateTime: Date;
  title?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ModernDateTimePicker({ 
  visible, 
  onClose, 
  onConfirm, 
  currentDateTime, 
  title = "Edit Date & Time" 
}: ModernDateTimePickerProps) {
  const { theme } = useAppSettingsStore();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  
  const [selectedDate, setSelectedDate] = useState(new Date(currentDateTime));

  // Generate date options (30 days back, 7 days forward)
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 30; i >= -7; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date);
    }
    return dates;
  };

  const [availableDates] = useState(generateDates());
  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ..., 55
  const periods = ['AM', 'PM'];

  useEffect(() => {
    if (visible) {
      setSelectedDate(new Date(currentDateTime));
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: SCREEN_HEIGHT,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleConfirm = () => {
    onConfirm(selectedDate);
    onClose();
  };

  const updateDateTime = (updates: Partial<{
    date: Date;
    hour: number;
    minute: number;
    period: string;
  }>) => {
    const newDate = new Date(selectedDate);
    
    if (updates.date) {
      newDate.setFullYear(updates.date.getFullYear(), updates.date.getMonth(), updates.date.getDate());
    }
    if (updates.hour !== undefined || updates.period !== undefined) {
      const currentHour = newDate.getHours();
      const currentPeriod = currentHour >= 12 ? 'PM' : 'AM';
      const current12Hour = currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour;
      
      const hour12 = updates.hour !== undefined ? updates.hour : current12Hour;
      const period = updates.period !== undefined ? updates.period : currentPeriod;
      
      // Convert to 24-hour format
      let hour24 = hour12;
      if (period === 'AM' && hour12 === 12) {
        hour24 = 0;
      } else if (period === 'PM' && hour12 !== 12) {
        hour24 = hour12 + 12;
      }
      
      newDate.setHours(hour24);
    }
    if (updates.minute !== undefined) {
      newDate.setMinutes(updates.minute);
    }
    
    setSelectedDate(newDate);
  };

  const formatDisplayDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateOption = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const renderScrollableColumn = (
    title: string,
    items: any[],
    selectedValue: any,
    onValueChange: (value: any) => void,
    formatter: (value: any) => string,
    compareFn?: (a: any, b: any) => boolean
  ) => (
    <View style={{ flex: 1 }}>
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: theme.secondaryText,
        textAlign: 'center',
        marginBottom: 12,
      }}>
        {title}
      </Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 60 }}
        style={{ height: 180 }}
      >
        {items.map((item, index) => {
          const isSelected = compareFn ? compareFn(item, selectedValue) : item === selectedValue;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => onValueChange(item)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                marginHorizontal: 4,
                borderRadius: 12,
                backgroundColor: isSelected ? `${theme.primary}20` : 'transparent',
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? theme.primary : theme.border,
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 16,
                  fontWeight: isSelected ? '600' : '400',
                  color: isSelected ? theme.primary : theme.text,
                }}
              >
                {formatter(item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: backdropAnim,
          }}
        >
          <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
            transform: [{ translateY: slideAnim }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Handle Bar */}
          <View style={{
            width: 40,
            height: 4,
            backgroundColor: theme.border,
            borderRadius: 2,
            alignSelf: 'center',
            marginTop: 12,
            marginBottom: 20,
          }} />

          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingBottom: 20,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: theme.text,
                marginBottom: 4,
              }}>
                {title}
              </Text>
              <Text style={{
                fontSize: 16,
                color: theme.secondaryText,
              }}>
                {formatDisplayDateTime(selectedDate)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${theme.secondaryText}10`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
          </View>

          {/* Date & Time Selectors */}
          <View style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            marginBottom: 24,
            gap: 8,
          }}>
            {/* Date Column */}
            {renderScrollableColumn(
              "Date",
              availableDates,
              selectedDate,
              (date: Date) => updateDateTime({ date }),
              formatDateOption,
              isSameDate
            )}

            {/* Hour Column */}
            {renderScrollableColumn(
              "Hour",
              hours,
              (() => {
                const hour24 = selectedDate.getHours();
                return hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
              })(),
              (hour: number) => updateDateTime({ hour }),
              (hour: number) => hour.toString()
            )}

            {/* Minute Column */}
            {renderScrollableColumn(
              "Min",
              minutes,
              Math.floor(selectedDate.getMinutes() / 5) * 5,
              (minute: number) => updateDateTime({ minute }),
              (minute: number) => minute.toString().padStart(2, '0')
            )}

            {/* AM/PM Column */}
            {renderScrollableColumn(
              "Period",
              periods,
              selectedDate.getHours() >= 12 ? 'PM' : 'AM',
              (period: string) => updateDateTime({ period }),
              (period: string) => period
            )}
          </View>

          {/* Action Buttons */}
          <View style={{
            flexDirection: 'row',
            paddingHorizontal: 24,
            gap: 12,
          }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 16,
                borderRadius: 16,
                backgroundColor: `${theme.secondaryText}10`,
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.secondaryText,
              }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              style={{
                flex: 2,
                paddingVertical: 16,
                borderRadius: 16,
                backgroundColor: theme.primary,
                alignItems: 'center',
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: 'white',
              }}>
                Update Date & Time
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}