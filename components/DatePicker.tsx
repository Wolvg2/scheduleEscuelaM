// components/DatePicker.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';

const COLORS = {
  blue: '#3A557C',
  green: '#8FC027',
  gray: '#A6A6A6',
  background: '#FFFFFF',
  dark: '#111111',
  lightBg: '#F8F9FA',
  border: '#E9ECEF',
};

type DatePickerProps = {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  selectedDate?: string;
  title: string;
};

export default function DatePicker({ 
  visible, 
  onClose, 
  onDateSelect, 
  selectedDate, 
  title 
}: DatePickerProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // Generate years (current year - 2 to current year + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i);

  // Month names
  const months = [
    { number: 1, name: 'Enero' },
    { number: 2, name: 'Febrero' },
    { number: 3, name: 'Marzo' },
    { number: 4, name: 'Abril' },
    { number: 5, name: 'Mayo' },
    { number: 6, name: 'Junio' },
    { number: 7, name: 'Julio' },
    { number: 8, name: 'Agosto' },
    { number: 9, name: 'Septiembre' },
    { number: 10, name: 'Octubre' },
    { number: 11, name: 'Noviembre' },
    { number: 12, name: 'Diciembre' },
  ];

  // Get days in selected month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleConfirm = () => {
    const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
    onDateSelect(formattedDate);
    onClose();
  };

  const formatDisplayDate = () => {
    const monthName = months.find(m => m.number === selectedMonth)?.name;
    return `${selectedDay} de ${monthName} de ${selectedYear}`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          
          <View style={styles.selectedDateContainer}>
            <Text style={styles.selectedDateLabel}>Fecha seleccionada:</Text>
            <Text style={styles.selectedDate}>{formatDisplayDate()}</Text>
          </View>

          <View style={styles.pickersContainer}>
            {/* Year Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Año</Text>
              <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                {years.map(year => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.pickerItem,
                      selectedYear === year && styles.pickerItemSelected
                    ]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedYear === year && styles.pickerItemTextSelected
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Month Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Mes</Text>
              <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                {months.map(month => (
                  <TouchableOpacity
                    key={month.number}
                    style={[
                      styles.pickerItem,
                      selectedMonth === month.number && styles.pickerItemSelected
                    ]}
                    onPress={() => {
                      setSelectedMonth(month.number);
                      // Adjust day if it's beyond the new month's days
                      const newDaysInMonth = getDaysInMonth(selectedYear, month.number);
                      if (selectedDay > newDaysInMonth) {
                        setSelectedDay(newDaysInMonth);
                      }
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedMonth === month.number && styles.pickerItemTextSelected
                    ]}>
                      {month.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Day Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Día</Text>
              <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                {days.map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.pickerItem,
                      selectedDay === day && styles.pickerItemSelected
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedDay === day && styles.pickerItemTextSelected
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Quick Select Buttons */}
          <View style={styles.quickSelectContainer}>
            <Text style={styles.quickSelectLabel}>Fechas rápidas:</Text>
            <View style={styles.quickSelectButtons}>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const today = new Date();
                  setSelectedYear(today.getFullYear());
                  setSelectedMonth(today.getMonth() + 1);
                  setSelectedDay(today.getDate());
                }}
              >
                <Text style={styles.quickSelectButtonText}>Hoy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const firstDayOfMonth = new Date();
                  firstDayOfMonth.setDate(1);
                  setSelectedYear(firstDayOfMonth.getFullYear());
                  setSelectedMonth(firstDayOfMonth.getMonth() + 1);
                  setSelectedDay(1);
                }}
              >
                <Text style={styles.quickSelectButtonText}>Inicio del Mes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1);
                  setSelectedYear(firstDayOfYear.getFullYear());
                  setSelectedMonth(1);
                  setSelectedDay(1);
                }}
              >
                <Text style={styles.quickSelectButtonText}>Inicio del Año</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 16,
  },
  selectedDateContainer: {
    backgroundColor: COLORS.lightBg,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDateLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  selectedDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.blue,
  },
  pickersContainer: {
    flexDirection: 'row',
    height: 150,
    marginBottom: 16,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  picker: {
    backgroundColor: COLORS.lightBg,
    borderRadius: 8,
    maxHeight: 120,
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: COLORS.blue,
  },
  pickerItemText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  pickerItemTextSelected: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
  quickSelectContainer: {
    marginBottom: 16,
  },
  quickSelectLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  quickSelectButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickSelectButton: {
    backgroundColor: COLORS.lightBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickSelectButtonText: {
    fontSize: 12,
    color: COLORS.blue,
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gray,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.background,
  },
});