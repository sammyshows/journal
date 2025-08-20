import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettingsStore } from '../stores/useAppSettingsStore';

interface DateTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (datetime: Date) => void;
  currentDateTime: Date;
  title?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function DateTimePicker({ 
  visible, 
  onClose, 
  onConfirm, 
  currentDateTime, 
  title = "Edit Date & Time" 
}: DateTimePickerProps) {
  const { theme } = useAppSettingsStore();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  
  const [selectedDate, setSelectedDate] = useState(new Date(currentDateTime));
  const [calendarDate, setCalendarDate] = useState(new Date(currentDateTime));
  const [showHourDropdown, setShowHourDropdown] = useState(false);
  const [showMinuteDropdown, setShowMinuteDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedDate(new Date(currentDateTime));
      setCalendarDate(new Date(currentDateTime));
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

  const generateCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    // First day of the week for the first day of month
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 6 weeks (42 days) to fill calendar grid
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const formatDisplayDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === calendarDate.getMonth();
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(calendarDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCalendarDate(newDate);
  };

  const selectDate = (date: Date) => {
    const newDateTime = new Date(selectedDate);
    newDateTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(newDateTime);
  };

  const updateTime = (type: 'hour' | 'minute' | 'period', value: number | string) => {
    const newDate = new Date(selectedDate);
    
    if (type === 'hour') {
      const currentPeriod = newDate.getHours() >= 12 ? 'PM' : 'AM';
      let hour24 = value as number;
      if (currentPeriod === 'AM' && hour24 === 12) {
        hour24 = 0;
      } else if (currentPeriod === 'PM' && hour24 !== 12) {
        hour24 = hour24 + 12;
      }
      newDate.setHours(hour24);
    } else if (type === 'minute') {
      newDate.setMinutes(value as number);
    } else if (type === 'period') {
      const currentHour = newDate.getHours();
      const current12Hour = currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour;
      
      let newHour24 = current12Hour;
      if (value === 'AM' && current12Hour === 12) {
        newHour24 = 0;
      } else if (value === 'PM' && current12Hour !== 12) {
        newHour24 = current12Hour + 12;
      }
      newDate.setHours(newHour24);
    }
    
    setSelectedDate(newDate);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const periods = ['AM', 'PM'];

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const currentHour12 = (() => {
    const hour24 = selectedDate.getHours();
    return hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  })();
  
  const currentMinute = Math.floor(selectedDate.getMinutes() / 5) * 5;
  const currentPeriod = selectedDate.getHours() >= 12 ? 'PM' : 'AM';

  const renderDropdown = (
    title: string,
    value: string | number,
    isOpen: boolean,
    onToggle: () => void,
    options: (string | number)[],
    onSelect: (value: string | number) => void,
    formatter?: (value: string | number) => string
  ) => (
    <View style={{ flex: 1, marginHorizontal: 4 }}>
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: theme.secondaryText,
        marginBottom: 8,
      }}>
        {title}
      </Text>
      <View style={{ position: 'relative' }}>
        <TouchableOpacity
          onPress={onToggle}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: isOpen ? theme.primary : theme.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '500',
            color: theme.text,
          }}>
            {formatter ? formatter(value) : value}
          </Text>
          <Ionicons 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={theme.secondaryText} 
          />
        </TouchableOpacity>
        
        {isOpen && (
          <View style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: theme.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
            zIndex: 1000,
            maxHeight: 200,
          }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    onSelect(option);
                    onToggle();
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: value === option ? `${theme.primary}20` : 'transparent',
                    borderRadius: 8,
                    marginHorizontal: 4,
                    marginVertical: 1,
                  }}
                >
                  <Text style={{
                    fontSize: 16,
                    fontWeight: value === option ? '600' : '400',
                    color: value === option ? theme.primary : theme.text,
                    textAlign: 'center',
                  }}>
                    {formatter ? formatter(option) : option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
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
          <TouchableOpacity 
            style={{ flex: 1 }} 
            onPress={() => {
              // Close dropdowns if any are open, otherwise close modal
              if (showHourDropdown || showMinuteDropdown || showPeriodDropdown) {
                setShowHourDropdown(false);
                setShowMinuteDropdown(false);
                setShowPeriodDropdown(false);
              } else {
                onClose();
              }
            }} 
          />
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
            transform: [{ translateY: slideAnim }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            maxHeight: SCREEN_HEIGHT * 0.85,
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
            marginBottom: 16,
          }} />

          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingBottom: 16,
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

          {/* Scrollable Content */}
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Calendar Section */}
            <View style={{
              paddingHorizontal: 24,
              marginBottom: 24,
            }}>
              {/* Month Navigation */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <TouchableOpacity
                  onPress={() => navigateMonth('prev')}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: theme.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="chevron-back" size={20} color={theme.text} />
                </TouchableOpacity>

                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: theme.text,
                }}>
                  {formatMonthYear(calendarDate)}
                </Text>

                <TouchableOpacity
                  onPress={() => navigateMonth('next')}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: theme.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="chevron-forward" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Week Day Headers */}
              <View style={{
                flexDirection: 'row',
                marginBottom: 6,
              }}>
                {weekDays.map((day) => (
                  <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: theme.secondaryText,
                    }}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
              }}>
                {calendarDays.map((day, index) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentMonthDay = isCurrentMonth(day);
                  const isTodayDay = isToday(day);

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => selectDate(day)}
                      style={{
                        height: 32,
                        width: '14.28%', // 1/7 of width
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                        backgroundColor: isSelected ? theme.primary : 'transparent',
                        marginBottom: 4,
                      }}
                    >
                      <Text style={{
                        fontSize: 16,
                        fontWeight: isSelected || isTodayDay ? '600' : '400',
                        color: isSelected ? 'white' : 
                               isTodayDay ? theme.primary :
                               isCurrentMonthDay ? theme.text : theme.muted,
                      }}>
                        {day.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Time Section */}
            <View style={{
              paddingHorizontal: 24,
              marginBottom: 60,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.text,
                marginBottom: 12,
              }}>
                Time
              </Text>

              <View style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}>
                {/* Hour Dropdown */}
                {renderDropdown(
                  "Hour",
                  currentHour12,
                  showHourDropdown,
                  () => {
                    setShowHourDropdown(!showHourDropdown);
                    setShowMinuteDropdown(false);
                    setShowPeriodDropdown(false);
                  },
                  hours,
                  (hour) => updateTime('hour', hour),
                  (hour) => hour.toString()
                )}

                {/* Minute Dropdown */}
                {renderDropdown(
                  "Minute",
                  currentMinute,
                  showMinuteDropdown,
                  () => {
                    setShowMinuteDropdown(!showMinuteDropdown);
                    setShowHourDropdown(false);
                    setShowPeriodDropdown(false);
                  },
                  minutes,
                  (minute) => updateTime('minute', minute),
                  (minute) => minute.toString().padStart(2, '0')
                )}

                {/* Period Dropdown */}
                {renderDropdown(
                  "AM/PM",
                  currentPeriod,
                  showPeriodDropdown,
                  () => {
                    setShowPeriodDropdown(!showPeriodDropdown);
                    setShowHourDropdown(false);
                    setShowMinuteDropdown(false);
                  },
                  periods,
                  (period) => updateTime('period', period)
                )}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={{
            flexDirection: 'row',
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 40,
            gap: 12,
            backgroundColor: theme.background,
            borderTopWidth: 1,
            borderTopColor: theme.border,
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