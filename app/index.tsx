// app/index.tsx
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React from 'react';
import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Index() {
  /* Navegación al login */
  const handleGetStarted = () => {
    router.push('/login');
  };


  const testLocalNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
      title: 'Prueba local',
      body: 'Hello World! Esta es una notificación local.',
      sound: 'default',
      },

      trigger: { seconds: 15, repeats: false, channelId: 'reminders' },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.logoSection}>
        <Image
          source={{ uri: 'https://i.ibb.co/xtJPqLMJ/Escudo-1.png' }}
          style={{ width: 150, height: 150 }}
        />
        <Text style={styles.header}>
          Escuela Metropolitana{'\n'}Agenda de citas
        </Text>
      </View>

      {/* Botón principal */}
      <TouchableOpacity
        style={styles.mainBtn}
        onPress={handleGetStarted}
        activeOpacity={0.5}
      >
        <Text style={styles.getStartedText}>Ingresar</Text>
      </TouchableOpacity>

      {/* 🔸 Botón temporal para probar notificaciones */}
      <View style={styles.testBtnWrapper}>
        <Button title="Probar notificación" onPress={testLocalNotification} />
      </View>
    </ScrollView>
  );
}

/* ---------- ESTILOS ---------- */

const COLORS = {
  blue: '#3A557C',
  green: '#8FC027',
  gray: '#A6A6A6',
  background: '#000000',
  dark: '#111111',
  accent: '#8FC027',
  text: '#FFFFFF',
  lightGray: '#333333',
  border: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 80,
  },
  header: {
    textAlign: 'center',
    fontSize: 30,
    color: COLORS.text,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    marginBottom: 20,
  },
  getStartedText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  mainBtn: {
    backgroundColor: COLORS.green,
    marginHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: 'center',
    marginBottom: 32,
  },
  logoSection: {
    alignItems: 'center',
  },
  /* wrapper para separar el botón de prueba */
  testBtnWrapper: {
    marginHorizontal: 32,
    marginBottom: 48,
  },
});
