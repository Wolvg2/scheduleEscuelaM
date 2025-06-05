// app/schedule.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';

// =============== HELPERS ===============
const today = new Date();
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getMonthName(date: Date) {
  return date.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
}

// ========== MOCK AGENDA LIST ===========
const mockAgenda = [
  { id: 'a1', name: 'Fulanito', date: '15 de junio', time: '9:20' },
  { id: 'a2', name: 'Menganito', date: '16 de junio', time: '10:30' },
  { id: 'a3', name: 'Perenganito', date: '17 de junio', time: '11:30' },
];

export default function Schedule() {
  const [current, setCurrent] = useState(today);
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [hour, setHour] = useState('09:00');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const year = current.getFullYear();
  const month = current.getMonth();
  const totalDays = daysInMonth(year, month);

  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  const changeMonth = (dir: -1 | 1) => {
    const newDate = new Date(year, month + dir, 1);
    setCurrent(newDate);
    setSelectedDay(1);
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Agendar cita' }} />

      {/* Calendario */}
      <View style={styles.calendarCard}>
        {/* Header Mes */}
        <View style={styles.calHeader}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Text style={styles.chevron}>{'<'}</Text>
          </TouchableOpacity>

          <Text style={styles.monthText}>{getMonthName(current)}</Text>

          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Text style={styles.chevron}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* Grid días */}
        <View style={styles.daysGrid}>
          {daysArray.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayCell,
                selectedDay === day && styles.daySelected,
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text
                style={[
                  styles.dayText,
                  selectedDay === day && styles.dayTextSelected,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selector de hora */}
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Hora</Text>

          <TextInput
            value={hour}
            onChangeText={setHour}
            keyboardType="numeric"
            style={styles.timeInput}
          />

          <TouchableOpacity
            style={[
              styles.ampmBtn,
              ampm === 'AM' && styles.ampmActive,
            ]}
            onPress={() => setAmpm('AM')}
          >
            <Text
              style={[
                styles.ampmText,
                ampm === 'AM' && styles.ampmTextActive,
              ]}
            >
              AM
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.ampmBtn,
              ampm === 'PM' && styles.ampmActive,
            ]}
            onPress={() => setAmpm('PM')}
          >
            <Text
              style={[
                styles.ampmText,
                ampm === 'PM' && styles.ampmTextActive,
              ]}
            >
              PM
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Agenda mock */}
      <Text style={styles.agendaTitle}>Mi agenda</Text>
      {mockAgenda.map((item) => (
        <View key={item.id} style={styles.agendaCard}>
          <View style={styles.agendaAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.agendaName}>{item.name}</Text>
            <Text style={styles.agendaSub}>{item.date}</Text>
          </View>
          <Text style={styles.agendaTime}>{item.time}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

/* ---------- ESTILOS ---------- */
const COLORS = {
  blue: '#3A557C',
  green: '#8FC027',
  gray: '#A6A6A6',
  lightBg: '#F5F5F5',
  dark: '#111',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
    padding: 16,
  },

  /* Cal card */
  calendarCard: {
    backgroundColor: '#E5E5E5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
  },
  chevron: { fontSize: 20, color: COLORS.gray },

  /* Grid */
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daySelected: {
    backgroundColor: COLORS.dark,
    borderRadius: 20,
  },
  dayText: { color: COLORS.dark },
  dayTextSelected: { color: '#fff', fontWeight: 'bold' },

  /* Time row */
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  timeLabel: {
    fontWeight: '700',
    marginRight: 12,
    fontSize: 16,
    color: COLORS.dark,
  },
  timeInput: {
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 6,
    width: 60,
    textAlign: 'center',
    marginRight: 12,
  },
  ampmBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  ampmActive: { backgroundColor: '#fff' },
  ampmText: { color: COLORS.dark, fontWeight: '600' },
  ampmTextActive: { color: COLORS.dark },

  /* Agenda */
  agendaTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: COLORS.dark,
  },
  agendaCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.blue,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  agendaAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray,
    marginRight: 12,
  },
  agendaName: { color: '#fff', fontWeight: '700' },
  agendaSub: { color: '#d0d0d0', fontSize: 12 },
  agendaTime: { color: '#fff', fontWeight: '600' },
});
