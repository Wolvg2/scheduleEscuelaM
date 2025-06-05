// app/login.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Checkbox from 'expo-checkbox';

// ⬅️ Solo un nivel “..” porque login.tsx está en app/ (no en (tabs))
import Escudo from '../assets/images/Escudo.png';

export default function LoginScreen() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [remember, setRemember] = useState(false);

  return (
    <View style={styles.container}>
      {/* LOGO */}
      <Image source={Escudo} style={styles.logo} />

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'signup' && styles.tabActive]}
          onPress={() => setTab('signup')}
        >
          <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
            Registrarse
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'login' && styles.tabActive]}
          onPress={() => setTab('login')}
        >
          <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
            Iniciar sesión
          </Text>
        </TouchableOpacity>
      </View>

      {/* INPUT */}
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {/* CHECKBOX */}
      <View style={styles.checkboxRow}>
        <Checkbox
          value={remember}
          onValueChange={setRemember}
          color={remember ? '#8FC027' : undefined}
        />
        <Text style={styles.checkboxLabel}>Recuérdame</Text>
      </View>

      {/* DISCLAIMER */}
      <Text style={styles.disclaimer}>
        Al continuar, aceptas nuestras{' '}
        <Text style={styles.link}>políticas de privacidad</Text>.
      </Text>

      {/* BUTTON */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>
          {tab === 'signup' ? 'Verificar correo' : 'Entrar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- ESTILOS ---------- */

const COLORS = {
  blue: '#3A557C',
  green: '#8FC027',
  gray: '#A6A6A6',
  background: '#111111',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 30,
  },
  tab: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  tabActive: {
    backgroundColor: COLORS.green,
  },
  tabText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: '#222',
    borderRadius: 10,
    color: '#fff',
    padding: 14,
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  checkboxLabel: {
    color: '#ccc',
    marginLeft: 8,
  },
  disclaimer: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 30,
  },
  link: {
    color: COLORS.green,
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: COLORS.green,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
