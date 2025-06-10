// app/home.tsx
import React, { use, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Link } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { onAuthStateChanged } from "firebase/auth";
import { useAppointments } from '@/hooks/useAppointments';

export default function Home() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.uid);
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);


  const { appointments, loading: appointmentsLoading } = useAppointments(
    auth.currentUser?.uid || '',
    'tutor'
  );

  // Debug logging
  useEffect(() => {
    console.log('Current user ID:', currentUser?.uid);
    console.log('Appointments count:', appointments.length);
    console.log('Appointments:', appointments);
    console.log('Loading:', appointmentsLoading);
  }, [currentUser, appointments, appointmentsLoading]);

  // Cargar datos usuario
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
          setUserName(userData.name || '');
          console.log('User data loaded:', userData);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    fetchAppointments();
  }, [currentUser]);

   const getAppointmentByStatus = () => {
    const now = new Date();
    const upcoming = appointments.filter(apt => {
      if (apt.status === 'cancelled') return false;
      if (apt.status === 'pending' || apt.status === 'confirmed') {
        // Improved date comparison
        const appointmentDate = new Date(apt.date);
        return appointmentDate >= now || apt.status === 'pending';
      }
      return false;
    });
    
    const past = appointments.filter(apt => {
      if (apt.status === 'cancelled') return true;
      if (apt.status === 'confirmed') {
        const appointmentDate = new Date(apt.date);
        return appointmentDate < now;
      }
      return false;
    });
    
    return { upcoming, past };
  };

  const { upcoming, past } = getAppointmentByStatus();


  const renderAppointment = ({ item }: { item: any }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <Text style={styles.appointmentDate}>
          {new Date(item.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
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

      <Text style={styles.appointmentTime}>🕐 {item.time}</Text>

      {item.reason && (
        <Text style={styles.appointmentReason}>📝 {item.reason}</Text>
      )}

      {item.docenteId && (
        <Text style={styles.appointmentTeacher}>Profesor asignado</Text>
      )}
    </View>
  );

  const renderEmptyAppointments = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyTitle}>No tienes citas programadas</Text>
      <Text style={styles.emptySubtitle}>
        Agenda tu primera cita con un profesor usando el botón de arriba
      </Text>
    </View>
  );



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

      {/* APPOINTMENTS SECTION */}
      <View style={styles.appointmentsSection}>
        <Text style={styles.sectionTitle}>Mis Citas</Text>

        {appointmentsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3A557C" />
            <Text style={styles.loadingText}>Cargando citas...</Text>
          </View>
        ) : appointments.length === 0 ? (
          renderEmptyAppointments()
        ) : (
          <>
            {/* UPCOMING APPOINTMENTS */}
            {upcoming.length > 0 && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>
                  Próximas citas ({upcoming.length})
                </Text>
                <FlatList
                  data={upcoming}
                  keyExtractor={(item) => item.id}
                  renderItem={renderAppointment}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {/* PAST APPOINTMENTS */}
            {past.length > 0 && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>
                  Historial ({past.length})
                </Text>
                <FlatList
                  data={past.slice(0, 5)} // Show only last 5 past appointments
                  keyExtractor={(item) => item.id}
                  renderItem={renderAppointment}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
                {past.length > 5 && (
                  <TouchableOpacity style={styles.viewMoreBtn}>
                    <Text style={styles.viewMoreText}>Ver más historial</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </View>

      {/* QUICK STATS */}
      {appointments.length > 0 && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{appointments.length}</Text>
              <Text style={styles.statLabel}>Total de citas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{upcoming.length}</Text>
              <Text style={styles.statLabel}>Próximas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {appointments.filter(apt => apt.status === 'confirmed').length}
              </Text>
              <Text style={styles.statLabel}>Confirmadas</Text>
            </View>
          </View>
        </View>
      )}
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
  lightBg: '#F8F9FA',
  border: '#E9ECEF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  backArrow: {
    fontSize: 24,
    color: COLORS.dark,
  },
  userInfo: {
    alignItems: 'center',
    flex: 1,
  },
  profileDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.gray,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
  },

  /* Main button */
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

  /* Appointments section */
  appointmentsSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 16,
  },
  subsection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 12,
  },

  /* Appointment cards */
  appointmentCard: {
    backgroundColor: COLORS.lightBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blue,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    flex: 1,
    marginRight: 8,
    textTransform: 'capitalize',
  },
  appointmentTime: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 6,
  },
  appointmentReason: {
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  appointmentTeacher: {
    fontSize: 14,
    color: COLORS.blue,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Loading */
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: COLORS.blue,
    marginTop: 12,
    fontSize: 16,
  },

  /* View more */
  viewMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewMoreText: {
    color: COLORS.blue,
    fontSize: 14,
    fontWeight: '500',
  },

  /* Stats section */
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