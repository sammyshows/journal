import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettingsStore } from '../stores/useAppSettingsStore';

interface ModernTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (time: string) => void;
  currentTime: string;
  title?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ModernTimePicker({ 
  visible, 
  onClose, 
  onSelect, 
  currentTime, 
  title = "Select Time" 
}: ModernTimePickerProps) {
  const { theme } = useAppSettingsStore();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  
  const [selectedHour, setSelectedHour] = useState(() => {
    const [hour] = currentTime.split(':');
    const hour24 = parseInt(hour, 10);
    return hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  });
  
  const [selectedMinute, setSelectedMinute] = useState(() => {
    const [, minute] = currentTime.split(':');
    return Math.floor(parseInt(minute, 10) / 5) * 5; // Round to nearest 5
  });

  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const [hour] = currentTime.split(':');
    return parseInt(hour, 10) >= 12 ? 'PM' : 'AM';
  });

  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ..., 55
  const periods = ['AM', 'PM'];

  useEffect(() => {
    if (visible) {
      // Update selected values when modal opens with current time
      const [hour] = currentTime.split(':');
      const [, minute] = currentTime.split(':');
      const hour24 = parseInt(hour, 10);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const roundedMinute = Math.floor(parseInt(minute, 10) / 5) * 5;
      const period = hour24 >= 12 ? 'PM' : 'AM';
      
      setSelectedHour(hour12);
      setSelectedMinute(roundedMinute);
      setSelectedPeriod(period);
      
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
  }, [visible, currentTime]);

  const handleConfirm = () => {
    // Convert 12-hour to 24-hour format
    let hour24 = selectedHour;
    if (selectedPeriod === 'AM' && selectedHour === 12) {
      hour24 = 0;
    } else if (selectedPeriod === 'PM' && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    }
    
    const timeString = `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onSelect(timeString);
    onClose();
  };

  const formatDisplayTime = (hour: number, minute: number, period: string) => {
    return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const renderScrollableColumn = (
    title: string,
    items: any[],
    selectedValue: any,
    onValueChange: (value: any) => void,
    formatter: (value: any) => string
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
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onValueChange(item)}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginHorizontal: 4,
              borderRadius: 12,
              backgroundColor: selectedValue === item ? `${theme.primary}20` : 'transparent',
              borderWidth: selectedValue === item ? 2 : 1,
              borderColor: selectedValue === item ? theme.primary : theme.border,
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontSize: 16,
                fontWeight: selectedValue === item ? '600' : '400',
                color: selectedValue === item ? theme.primary : theme.text,
              }}
            >
              {formatter(item)}
            </Text>
          </TouchableOpacity>
        ))}
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
                {formatDisplayTime(selectedHour, selectedMinute, selectedPeriod)}
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

          {/* Time Selectors */}
          <View style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            marginBottom: 24,
            gap: 8,
          }}>
            {/* Hour Column */}
            {renderScrollableColumn(
              "Hour",
              hours,
              selectedHour,
              setSelectedHour,
              (hour: number) => hour.toString()
            )}

            {/* Minute Column */}
            {renderScrollableColumn(
              "Min",
              minutes,
              selectedMinute,
              setSelectedMinute,
              (minute: number) => minute.toString().padStart(2, '0')
            )}

            {/* AM/PM Column */}
            {renderScrollableColumn(
              "Period",
              periods,
              selectedPeriod,
              setSelectedPeriod,
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
                Set Time
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}