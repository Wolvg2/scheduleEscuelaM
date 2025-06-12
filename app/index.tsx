// app/index.tsx
import React, {useEffect,useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';


export default function Index() {
  const handleGetStarted = () => {
    router.push('/login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.logoSection}>
        
          <View >
            <Image source={{ uri: 'https://i.ibb.co/xtJPqLMJ/Escudo-1.png', }}
            style={{ width: 150, height: 150 }}/>
          </View>
          <Text style={styles.header}>Escuela Metropolitana   {'\n'}  Agenda de citas</Text>
          </View>
      
      
        <TouchableOpacity style={styles.mainBtn}
          onPress={handleGetStarted}
          activeOpacity={0.5}
        >
          <Text style={styles.getStartedText}>Ingresar</Text>
        </TouchableOpacity>
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
  /* header */
  header: {
    alignItems: 'center',
    fontSize:30,
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
  /*Logo*/
    logoSection: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    borderColor: COLORS.accent,
  },
  logo: {
    color: COLORS.accent,
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
