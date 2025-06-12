// app/homeAdmin.tsx
import React, { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, User } from "firebase/auth";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList
} from 'react-native';
import { router } from 'expo-router';

type UserData = {
  id: string;
  name: string;
  email: string;
  role: 'docente' | 'tutor' | 'admin';
  subject?: string;
  emailVerified: boolean;
  createdAt: string;
};

type AppointmentData = {
  id: string;
  tutorId: string;
  docenteId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  reason: string;
  createdAt: string;
};

export default function HomeAdmin() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'users' | 'appointments'>('users');

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Verify user is admin
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (userData?.role !== 'admin') {
          Alert.alert('Acceso denegado', 'No tienes permisos de administrador');
          router.replace('/');
          return;
        }
        
        setCurrentUser(user);
      } else {
        router.replace('/login');
      }
      setAuthLoading(false);
    });
    
    return unsubscribe;
  }, []);

  // Load users
  useEffect(() => {
    if (!currentUser) return;

    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading users:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Load appointments
  useEffect(() => {
    if (!currentUser) return;

    const appointmentsQuery = query(
      collection(db, 'appointments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppointmentData[];
      
      setAppointments(appointmentsData);
    }, (error) => {
      console.error('Error loading appointments:', error);
    });

    return unsubscribe;
  }, [currentUser]);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar sesión', 
          onPress: () => {
            auth.signOut();
            router.replace('/');
          }
        }
      ]
    );
  };

  const renderUser = ({ item }: { item: UserData }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>
          {item.role === 'docente' ? 'Profesor' : 
           item.role === 'tutor' ? 'Padre de Familia' : 'Administrador'}
        </Text>
        {item.subject && (
          <Text style={styles.userSubject}>Materia: {item.subject}</Text>
        )}
      </View>
      <View style={[
        styles.statusBadge,
        { backgroundColor: item.emailVerified ? '#8FC027' : '#FF6B6B' }
      ]}>
        <Text style={styles.statusText}>
          {item.emailVerified ? 'Verificado' : 'Pendiente'}
        </Text>
      </View>
    </View>
  );

  const renderAppointment = ({ item }: { item: AppointmentData }) => (
    <View style={styles.appointmentCard}>
      <Text style={styles.appointmentDate}>
        {new Date(item.date).toLocaleDateString('es-ES')} - {item.time}
      </Text>
      <Text style={styles.appointmentReason}>Motivo: {item.reason}</Text>
      <View style={[
        styles.statusBadge,
        {
          backgroundColor: item.status === 'confirmed' ? '#8FC027' :
            item.status === 'cancelled' ? '#FF6B6B' : '#FFA500'
        }
      ]}>
        <Text style={styles.statusText}>
          {item.status === 'pending' ? 'Pendiente' :
            item.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
        </Text>
      </View>
    </View>
  );

  if (authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3A557C" />
        <Text style={styles.loadingText}>Verificando permisos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel de Administración</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedView === 'users' && styles.activeTab]}
          onPress={() => setSelectedView('users')}
        >
          <Text style={[styles.tabText, selectedView === 'users' && styles.activeTabText]}>
            Usuarios ({users.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedView === 'appointments' && styles.activeTab]}
          onPress={() => setSelectedView('appointments')}
        >
          <Text style={[styles.tabText, selectedView === 'appointments' && styles.activeTabText]}>
            Citas ({appointments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3A557C" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      ) : (
        <>
          {selectedView === 'users' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Usuarios Registrados</Text>
              <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={renderUser}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {selectedView === 'appointments' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Todas las Citas</Text>
              <FlatList
                data={appointments}
                keyExtractor={(item) => item.id}
                renderItem={renderAppointment}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </>
      )}

      {/* Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Usuarios</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {users.filter(u => u.role === 'docente').length}
            </Text>
            <Text style={styles.statLabel}>Profesores</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {appointments.filter(a => a.status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Citas Pendientes</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const COLORS = {
  blue: '#3A557C',
  green: '#8FC027',
  gray: '#A6A6A6',
  background: '#FFFFFF',
  dark: '#111111',
  lightBg: '#F8F9FA',
  border: '#E9ECEF',
  danger: '#FF6B6B',
  warning: '#FFA500',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.blue,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  activeTabText: {
    color: COLORS.background,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: COLORS.lightBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: COLORS.blue,
    fontWeight: '500',
    marginBottom: 2,
  },
  userSubject: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  appointmentCard: {
    backgroundColor: COLORS.lightBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  appointmentReason: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: COLORS.blue,
    marginTop: 12,
    fontSize: 16,
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderTopWidth: 3,
    borderTopColor: COLORS.green,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
});