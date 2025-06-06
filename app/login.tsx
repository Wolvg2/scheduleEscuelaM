// src/screens/login.tsx
// Descripción: Pantalla de inicio de sesión y registro para una aplicación móvil
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image

} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { loginUser, registerUser } from '@/hooks/useAuth';
import { router } from 'expo-router';

// Colores base
const COLORS = {
  background: '#000000',
  text: '#FFFFFF',
  accent: '#8FC027',
  lightGray: '#333333',
  border: '#FFFFFF',
};

export default function LoginScreen() {
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [subject, setSubject] = useState('');

  const handlePress = async () => {
    if (tab == 'register') {
      if (role == 'docente' && !subject.trim) {
        alert('Favor de poner la materia que enseña');
        return;
      }
      const userCredential = await registerUser(email, password, name, role, role == 'docente' ? subject : undefined);
      if (userCredential) {
        console.log("Usuario registrado: " + userCredential.user.email);
        switch (role) {
          case 'docente':
            router.push('/homeDocente');
            break;
          case 'tutor':
            router.push('/home');
            break;
          case 'admin':
            router.push('/homeAdmin');
            break;
        }
      }
    } else {
      // Logica Login por hacer
      if (tab == 'login') {
        const userCredential = await loginUser(email, password);
        if (userCredential) {
          console.log("Usuario inicio sesion con exito");
          switch (role) {
            case 'docente':
              router.push('/homeDocente');
              break;
            case 'tutor':
              router.push('/home');
              break;
            case 'admin':
              router.push('/homeAdmin');
              break;
          }
        }
      }
    }
  }

  // Función para lquitar el campo de materia cuando no es profesor
  const handleRoleChange = (itemValue: string) => {
    setRole(itemValue);
    if (itemValue !== 'docente') {
      setSubject('');
    }
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoSection}>
        <Image source={{ uri: 'https://i.ibb.co/xtJPqLMJ/Escudo-1.png', }} style={{ width: 150, height: 150 }} />
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'register' && styles.tabActive]}
          onPress={() =>
            setTab('register')}
        >
          <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>Registrarse</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'login' && styles.tabActive]}
          onPress={() => setTab('login')}
        >
          <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Login */}
      {tab == 'login' && (
        <View>
          <TextInput
            style={styles.input}
            placeholder="Dirección de correo electrónico"
            placeholderTextColor={COLORS.lightGray}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={COLORS.lightGray}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

        </View>
      )}

      {tab === 'register' && (
        <View style={styles.dropdownContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nombre Completo"
            placeholderTextColor={COLORS.lightGray}
            keyboardType="default"
            autoCapitalize="none"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Dirección de correo electrónico"
            placeholderTextColor={COLORS.lightGray}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={COLORS.lightGray}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Text style={styles.label}>Selecciona tu rol</Text>
          <Picker
            selectedValue={role}
            onValueChange={(itemValue) => setRole(itemValue)}
            style={styles.picker}
            dropdownIconColor={COLORS.accent}
          >
            <Picker.Item label='Padre de Familia' value="tutor" />
            <Picker.Item label='Profesor/a' value="docente" />
            <Picker.Item label='Administrador' value="admin" />
          </Picker>

          {role == 'docente' && (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Materia"
                placeholderTextColor={COLORS.lightGray}
                secureTextEntry
                value={subject}
                onChangeText={setSubject}
              />
            </View>
          )}
        </View>
      )}

      {/* DISCLAIMER */}
      <Text style={styles.disclaimer}>
        Al verificar tu correo y continuar con el proceso de{' '}
        {tab === 'register' ? 'registro' : 'inicio de sesión'} de usuario, admites que has leído y estás de
        acuerdo con nuestras{' '}
        <Text
          style={styles.link}
          onPress={() => Linking.openURL('https://tu-dominio.com/politicas')}
        >
          políticas de privacidad
        </Text>
        .
      </Text>

      {/* BUTTON */}
      <TouchableOpacity style={styles.button} onPress={handlePress} >
        <Text style={styles.buttonText}>
          {tab === 'register' ? 'Registrarse' : 'Entrar'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  logoPlaceholder: {
    color: COLORS.accent,
    fontSize: 32,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderColor: COLORS.lightGray,
    marginBottom: 30,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    borderColor: COLORS.accent,
  },
  tabText: {
    color: COLORS.lightGray,
    fontSize: 16,
  },
  tabTextActive: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    paddingVertical: 10,
    marginBottom: 25,
    fontSize: 16,
  },
  label: {
    color: COLORS.text,
    marginBottom: 5,
  },
  dropdownContainer: {
    marginBottom: 25,
  },
  picker: {
    backgroundColor: COLORS.lightGray,
    color: COLORS.text,
    borderRadius: 5,
  },
  parentheses: {
    color: COLORS.lightGray,
    fontSize: 12,
  },
  disclaimer: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 30,
  },
  link: {
    color: COLORS.accent,
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoSection: {
    alignItems: 'center',
  },
  logo: {
    color: COLORS.accent,
    fontWeight: 'bold',

  },
});

