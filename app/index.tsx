// app/index.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { Link } from 'expo-router';

// Mock data
const mockTeachers = [
  { id: 't1', name: 'Profa. García', subject: 'Matemáticas' },
  { id: 't2', name: 'Profa. López', subject: 'Historia' },
  { id: 't3', name: 'Profa. Pérez', subject: 'Inglés' },
  { id: 't4', name: 'Profa. Sánchez', subject: 'Ciencias' },
];

export default function Home() {
  return (
    <ScrollView style={styles.container}>
      {/* ENCABEZADO */}
      <View style={styles.header}>
        <Link href="/"> {/* flecha “atrás” simulada */}
          <Text style={styles.backArrow}>←</Text>
        </Link>

        <Image
          source={require('../assets/images/avatar.png')} // circular placeholder
          style={styles.avatar}
        />

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.profileDot} />
      </View>

      {/* BOTÓN AGENDAR */}
      <Link href="/schedule" asChild>
        <TouchableOpacity style={styles.mainBtn}>
          <Text style={styles.mainBtnText}>Agendar una cita</Text>
        </TouchableOpacity>
      </Link>

      {/* DOCENTES DISPONIBLES */}
      <View style={styles.teacherSection}>
        <Text style={styles.sectionTitle}>Profesores disponibles</Text>

        <FlatList
          data={mockTeachers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Link href={`/teacher/${item.id}`} asChild>
              <TouchableOpacity style={styles.teacherRow}>
                <View style={styles.teacherAvatar} />
                <Text style={styles.teacherName}>{item.name}</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.teacherArrow}>→</Text>
              </TouchableOpacity>
            </Link>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
}

/* ---------- ESTILOS ---------- */

const COLORS = {
  blue: '#3A557C',
  green: '#8FC027',
  gray: '#A6A6A6',
  background: '#FFFFFF',
  dark: '#111111',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  /* header */
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  backArrow: {
    fontSize: 24,
    color: COLORS.dark,
    position: 'absolute',
    left: 16,
    top: 24,
  },
  profileDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.gray,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray,
    marginVertical: 16,
  },

  /* main button */
  mainBtn: {
    backgroundColor: COLORS.green,
    marginHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: 'center',
    marginBottom: 32,
  },
  mainBtnText: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: 'bold',
  },

  /* teachers list */
  teacherSection: {
    backgroundColor: COLORS.blue,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  sectionTitle: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  teacherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray,
    marginRight: 12,
  },
  teacherName: {
    color: COLORS.background,
    fontSize: 16,
  },
  teacherArrow: {
    color: COLORS.background,
    fontSize: 18,
  },
  separator: {
    height: 1,
    backgroundColor: '#284166',
  },
});
