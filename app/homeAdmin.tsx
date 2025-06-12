// app/homeAdmin.tsx
import React, { useEffect, useState } from 'react';
import { auth } from '@/firebase/config';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from '@/firebase/config';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useAdmin, Teacher, AppointmentWithDetails, TeacherAppointmentSummary, User } from '@/hooks/useAdmin';
import DatePicker from '@/components/DatePicker';

type ViewType = 'dashboard' | 'teachers' | 'users' | 'appointments' | 'reports';

export default function HomeAdmin() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<ViewType>('dashboard');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportType, setReportType] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  const {
    teachers,
    users,
    allAppointments,
    selectedTeacher,
    teacherAppointments,
    userStats,
    appointmentStats,
    loading,
    loadingStates, 
    selectTeacher,
    generateTeacherReport,
    generateAppointmentsReport,
    getAppointmentsByStatus,
    getRecentAppointments,
    toggleUserStatus,
    getUsersByRole,
    getUsersByStatus,
    getInactiveUsers,
    getUnverifiedUsers,
  } = useAdmin();

  // Estado de autenticacion  
  useEffect(() => {
    console.log('🔄 Setting up auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('👤 Firebase user found:', firebaseUser.uid);
          
          // Get user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            console.log('📄 User data from Firestore:', userData);
            
            // Check if user is admin
            if (userData.role !== 'admin') {
              console.log('❌ User is not admin, role:', userData.role);
              setAuthError('No tienes permisos de administrador');
              setAuthLoading(false);
              setTimeout(() => {
                router.replace('/login');
              }, 2000);
              return;
            }

            // Check if user is active
            if (userData.isActive === false) {
              console.log('❌ User account is inactive');
              setAuthError('Tu cuenta está desactivada');
              setAuthLoading(false);
              setTimeout(() => {
                auth.signOut();
                router.replace('/login');
              }, 2000);
              return;
            }

            
            const mappedUser: User = {
              id: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || firebaseUser.email || 'Sin nombre',
              email: userData.email || firebaseUser.email || '',
              role: userData.role,
              subject: userData.subject,
              isActive: userData.isActive ?? true,
              createdAt: userData.createdAt || firebaseUser.metadata?.creationTime || '',
              emailVerified: firebaseUser.emailVerified,
              lastLogin: userData.lastLogin,
            };

            console.log('✅ Admin user authenticated:', mappedUser);
            setCurrentUser(mappedUser);
            setAuthError(null);
          } else {
            console.log('❌ User document not found in Firestore');
            setAuthError('Usuario no encontrado en la base de datos');
            setTimeout(() => {
              auth.signOut();
              router.replace('/login');
            }, 2000);
          }
        } else {
          console.log('🚪 No authenticated user, redirecting to login');
          router.replace('/login');
        }
      } catch (error) {
        console.error('❌ Error verifying user:', error);
        setAuthError('Error al verificar usuario');
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      } finally {
        setAuthLoading(false);
      }
    });
    
    return unsubscribe;
  }, []);

  // Constante para cerrar sesion
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

  // Constante para el formato de fecha 
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Constante para generar reporte 
  const generateReport = () => {
    let reportData: AppointmentWithDetails[] = [];
    
    if (reportType === 'all') {
      reportData = generateAppointmentsReport(reportStartDate, reportEndDate);
    } else {
      reportData = generateAppointmentsReport(reportStartDate, reportEndDate, reportType);
    }

    Alert.alert(
      'Reporte Generado', 
      `Se encontraron ${reportData.length} citas en el rango seleccionado`,
      [
        { text: 'OK' },
        { 
          text: 'Ver Detalles', 
          onPress: () => {
            console.log('Report data:', reportData);
            // You could open a detailed view here
          }
        }
      ]
    );
  };

  // Vista del dashbord
  const renderDashboard = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Estadisticas de usuario */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Estadísticas de Usuarios</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Usuarios</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.totalTeachers}</Text>
            <Text style={styles.statLabel}>Profesores</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.totalTutors}</Text>
            <Text style={styles.statLabel}>Padres</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.green }]}>
            <Text style={styles.statNumber}>{userStats.activeUsers}</Text>
            <Text style={styles.statLabel}>Activos</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderTopColor: COLORS.success }]}>
            <Text style={styles.statNumber}>{userStats.verifiedUsers}</Text>
            <Text style={styles.statLabel}>Verificados</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.warning }]}>
            <Text style={styles.statNumber}>{userStats.unverifiedUsers}</Text>
            <Text style={styles.statLabel}>Sin Verificar</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.danger }]}>
            <Text style={styles.statNumber}>{userStats.inactiveUsers}</Text>
            <Text style={styles.statLabel}>Inactivos</Text>
          </View>
        </View>
      </View>

      {/* Estadisticas de cita */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Estadísticas de Citas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{appointmentStats.totalAppointments}</Text>
            <Text style={styles.statLabel}>Total Citas</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.warning }]}>
            <Text style={styles.statNumber}>{appointmentStats.pendingAppointments}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.green }]}>
            <Text style={styles.statNumber}>{appointmentStats.confirmedAppointments}</Text>
            <Text style={styles.statLabel}>Confirmadas</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.danger }]}>
            <Text style={styles.statNumber}>{appointmentStats.cancelledAppointments}</Text>
            <Text style={styles.statLabel}>Canceladas</Text>
          </View>
        </View>
      </View>

      {/* Estadisticas por periodo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏱ Citas por Período</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{appointmentStats.todayAppointments}</Text>
            <Text style={styles.statLabel}>Hoy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{appointmentStats.thisWeekAppointments}</Text>
            <Text style={styles.statLabel}>Esta Semana</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{appointmentStats.thisMonthAppointments}</Text>
            <Text style={styles.statLabel}>Este Mes</Text>
          </View>
        </View>
      </View>

      {/* Citas recientes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🕒 Citas Recientes (Últimos 7 días)</Text>
        <FlatList
          data={getRecentAppointments(7).slice(0, 5)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentDate}>{formatDate(item.date)} - {item.time}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
              </View>
              <Text style={styles.appointmentInfo}>👨‍🏫 {item.docenteName}</Text>
              <Text style={styles.appointmentInfo}>👤 {item.tutorName}</Text>
              <Text style={styles.appointmentReason} numberOfLines={2}>📝 {item.reason}</Text>
            </View>
          )}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay citas recientes</Text>
          }
        />
      </View>
    </ScrollView>
  );

  // Vista de Docentes
  const renderTeachers = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👨‍🏫 Lista de Profesores</Text>
        <FlatList
          data={teachers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.teacherCard,
                selectedTeacher?.id === item.id && styles.teacherCardSelected
              ]}
              onPress={() => {
                selectTeacher(item);
                setShowTeacherModal(true);
              }}
            >
              <View style={styles.teacherInfo}>
                <Text style={styles.teacherName}>{item.name}</Text>
                <Text style={styles.teacherSubject}>📚 {item.subject}</Text>
                <Text style={styles.teacherEmail}>✉ {item.email}</Text>
              </View>
              <View style={styles.teacherStats}>
                <Text style={styles.teacherStatNumber}>
                  {allAppointments.filter(a => a.docenteId === item.id).length}
                </Text>
                <Text style={styles.teacherStatLabel}>Citas</Text>
              </View>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay profesores registrados</Text>
          }
        />
      </View>
    </ScrollView>
  );

  // Vista de citas programadas
  const renderAppointments = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Todas las Citas</Text>
        
        {/* Botones filrados */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: COLORS.warning }]}
            onPress={() => console.log('Pending:', getAppointmentsByStatus('pending'))}
          >
            <Text style={styles.filterButtonText}>
              Pendientes ({appointmentStats.pendingAppointments})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: COLORS.green }]}
            onPress={() => console.log('Confirmed:', getAppointmentsByStatus('confirmed'))}
          >
            <Text style={styles.filterButtonText}>
              Confirmadas ({appointmentStats.confirmedAppointments})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: COLORS.danger }]}
            onPress={() => console.log('Cancelled:', getAppointmentsByStatus('cancelled'))}
          >
            <Text style={styles.filterButtonText}>
              Canceladas ({appointmentStats.cancelledAppointments})
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={allAppointments.slice(0, 20)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentDate}>{formatDate(item.date)} - {item.time}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
              </View>
              <Text style={styles.appointmentInfo}>👨‍🏫 {item.docenteName}</Text>
              <Text style={styles.appointmentInfo}>👤 {item.tutorName}</Text>
              <Text style={styles.appointmentReason} numberOfLines={2}>📝 {item.reason}</Text>
              {item.observations && (
                <Text style={styles.appointmentObservations} numberOfLines={1}>
                  💭 {item.observations}
                </Text>
              )}
            </View>
          )}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay citas registradas</Text>
          }
        />
      </View>
    </ScrollView>
  );

  // Vista de usuarios
  const renderUsers = () => {
    const handleToggleUserStatus = async (user: User) => {
      const newStatus = !user.isActive;
      const statusText = newStatus ? 'activar' : 'desactivar';
      
      Alert.alert(
        `${newStatus ? 'Activar' : 'Desactivar'} Usuario`,
        `¿Estás seguro de que quieres ${statusText} a ${user.name}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: async () => {
              const success = await toggleUserStatus(user.id, newStatus);
              if (success) {
                Alert.alert(
                  'Éxito',
                  `Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente`
                );
              } else {
                Alert.alert('Error', 'No se pudo actualizar el estado del usuario');
              }
            }
          }
        ]
      );
    };

    // Renderizar usuarios
    const renderUser = ({ item }: { item: User }) => (
      <View style={[
        styles.userCard,
        !item.isActive && styles.userCardInactive
      ]}>
        <View style={styles.userInfo}>
          <Text style={[
            styles.userName,
            !item.isActive && styles.userNameInactive
          ]}>
            {item.name}
          </Text>
          <Text style={styles.userEmail}>✉ {item.email}</Text>
          <Text style={styles.userRole}>
            👤 {item.role === 'docente' ? 'Profesor' : 
                item.role === 'tutor' ? 'Padre de Familia' : 'Administrador'}
          </Text>
          {item.subject && (
            <Text style={styles.userSubject}>📚 {item.subject}</Text>
          )}
          <View style={styles.userStatusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.emailVerified ? COLORS.success : COLORS.warning }
            ]}>
              <Text style={styles.statusText}>
                {item.emailVerified ? 'Verificado' : 'Sin Verificar'}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.isActive ? COLORS.green : COLORS.danger }
            ]}>
              <Text style={styles.statusText}>
                {item.isActive ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.userActions}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: item.isActive ? COLORS.danger : COLORS.green }
            ]}
            onPress={() => handleToggleUserStatus(item)}
          >
            <Text style={styles.toggleButtonText}>
              {item.isActive ? 'Desactivar' : 'Activar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Gestión de Usuarios</Text>
          
          {/* Filtrar botones */}
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[styles.filterButton, { backgroundColor: COLORS.green }]}
              onPress={() => console.log('Active users:', getUsersByStatus(true))}
            >
              <Text style={styles.filterButtonText}>
                Activos ({userStats.activeUsers})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, { backgroundColor: COLORS.danger }]}
              onPress={() => console.log('Inactive users:', getUsersByStatus(false))}
            >
              <Text style={styles.filterButtonText}>
                Inactivos ({userStats.inactiveUsers})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, { backgroundColor: COLORS.warning }]}
              onPress={() => console.log('Unverified users:', getUnverifiedUsers())}
            >
              <Text style={styles.filterButtonText}>
                Sin Verificar ({userStats.unverifiedUsers})
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUser}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay usuarios registrados</Text>
            }
          />
        </View>
      </ScrollView>
    );
  };

  // Vista de reporte
  const renderReports = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Generar Reportes</Text>
        
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => setShowReportsModal(true)}
        >
          <Text style={styles.reportButtonText}>📊 Generar Reporte de Citas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => {
            const teacherReports = generateTeacherReport();
            Alert.alert(
              'Reporte de Profesores',
              `Generado reporte para ${teacherReports.length} profesores`,
              [
                { text: 'OK' },
                { 
                  text: 'Ver Detalles', 
                  onPress: () => console.log('Teacher reports:', teacherReports)
                }
              ]
            );
          }}
        >
          <Text style={styles.reportButtonText}>👨‍🏫 Reporte por Profesor</Text>
        </TouchableOpacity>

        {/* Estadisticas de reportes */}
        <View style={styles.reportStatsContainer}>
          <Text style={styles.reportStatsTitle}>Resumen Rápido:</Text>
          <Text style={styles.reportStatsText}>• Total de profesores: {teachers.length}</Text>
          <Text style={styles.reportStatsText}>• Citas este mes: {appointmentStats.thisMonthAppointments}</Text>
          <Text style={styles.reportStatsText}>• Tasa de confirmación: {
            appointmentStats.totalAppointments > 0 
              ? Math.round((appointmentStats.confirmedAppointments / appointmentStats.totalAppointments) * 100)
              : 0
          }%</Text>
          <Text style={styles.reportStatsText}>• Tasa de cancelación: {
            appointmentStats.totalAppointments > 0 
              ? Math.round((appointmentStats.cancelledAppointments / appointmentStats.totalAppointments) * 100)
              : 0
          }%</Text>
        </View>
      </View>
    </ScrollView>
  );

  // Modal de docente
  const renderTeacherModal = () => (
    <Modal
      visible={showTeacherModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowTeacherModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Citas de {selectedTeacher?.name}
          </Text>
          <Text style={styles.modalSubtitle}>
            📚 {selectedTeacher?.subject}
          </Text>

          <ScrollView style={styles.modalScrollView}>
            {teacherAppointments.length > 0 ? (
              teacherAppointments.map(appointment => (
                <View key={appointment.id} style={styles.modalAppointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.appointmentDate}>
                      {formatDate(appointment.date)} - {appointment.time}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.appointmentInfo}>👤 {appointment.tutorName}</Text>
                  <Text style={styles.appointmentReason} numberOfLines={2}>📝 {appointment.reason}</Text>
                  {appointment.observations && (
                    <Text style={styles.appointmentObservations}>💭 {appointment.observations}</Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No hay citas para este profesor</Text>
            )}
          </ScrollView>

          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setShowTeacherModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Modal reporte
  const renderReportsModal = () => (
    <Modal
      visible={showReportsModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowReportsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Generar Reporte de Citas</Text>

          <Text style={styles.inputLabel}>Fecha de inicio:</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {reportStartDate ? formatDisplayDate(reportStartDate) : 'Seleccionar fecha de inicio'}
            </Text>
            <Text style={styles.dateButtonIcon}>📅</Text>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Fecha de fin:</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {reportEndDate ? formatDisplayDate(reportEndDate) : 'Seleccionar fecha de fin'}
            </Text>
            <Text style={styles.dateButtonIcon}>📅</Text>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Tipo de reporte:</Text>
          <View style={styles.reportTypeContainer}>
            {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.reportTypeButton,
                  reportType === type && styles.reportTypeButtonSelected
                ]}
                onPress={() => setReportType(type)}
              >
                <Text style={[
                  styles.reportTypeButtonText,
                  reportType === type && styles.reportTypeButtonTextSelected
                ]}>
                  {type === 'all' ? 'Todas' : 
                   type === 'pending' ? 'Pendientes' :
                   type === 'confirmed' ? 'Confirmadas' : 'Canceladas'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setShowReportsModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalGenerateButton}
              onPress={() => {
                generateReport();
                setShowReportsModal(false);
              }}
            >
              <Text style={styles.modalGenerateButtonText}>Generar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return COLORS.green;
      case 'cancelled': return COLORS.danger;
      case 'pending': return COLORS.warning;
      default: return COLORS.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      case 'pending': return 'Pendiente';
      default: return status;
    }
  };

  const formatDisplayDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  
  if (authError) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>❌ {authError}</Text>
        <ActivityIndicator size="small" color="#FF6B6B" style={{ marginTop: 12 }} />
      </View>
    );
  }

 
  if (authLoading || loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3A557C" />
        <Text style={styles.loadingText}>
          {authLoading ? 'Verificando permisos...' : 'Cargando panel de administración...'}
        </Text>
        {/* Muestra el estado de cargando*/}
        {!authLoading && (
          <View style={styles.loadingDetail}>
            <Text style={styles.loadingDetailText}>
              • Profesores: {loadingStates.teachers ? '🔄' : '✅'}
            </Text>
            <Text style={styles.loadingDetailText}>
              • Usuarios: {loadingStates.users ? '🔄' : '✅'}
            </Text>
            <Text style={styles.loadingDetailText}>
              • Citas: {loadingStates.appointments ? '🔄' : '✅'}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Panel de Administración</Text>
          <Text style={styles.headerSubtitle}>Bienvenido, {currentUser?.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedView === 'dashboard' && styles.activeTab]}
          onPress={() => setSelectedView('dashboard')}
        >
          <Text style={[styles.tabText, selectedView === 'dashboard' && styles.activeTabText]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedView === 'teachers' && styles.activeTab]}
          onPress={() => setSelectedView('teachers')}
        >
          <Text style={[styles.tabText, selectedView === 'teachers' && styles.activeTabText]}>
            Profesores
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedView === 'users' && styles.activeTab]}
          onPress={() => setSelectedView('users')}
        >
          <Text style={[styles.tabText, selectedView === 'users' && styles.activeTabText]}>
            Usuarios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedView === 'appointments' && styles.activeTab]}
          onPress={() => setSelectedView('appointments')}
        >
          <Text style={[styles.tabText, selectedView === 'appointments' && styles.activeTabText]}>
            Citas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedView === 'reports' && styles.activeTab]}
          onPress={() => setSelectedView('reports')}
        >
          <Text style={[styles.tabText, selectedView === 'reports' && styles.activeTabText]}>
            Reportes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {selectedView === 'dashboard' && renderDashboard()}
        {selectedView === 'teachers' && renderTeachers()}
        {selectedView === 'users' && renderUsers()}
        {selectedView === 'appointments' && renderAppointments()}
        {selectedView === 'reports' && renderReports()}
      </View>

      {/* Modals */}
      {renderTeacherModal()}
      {renderReportsModal()}
      
      {/* Date Pickers */}
      <DatePicker
        visible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        onDateSelect={setReportStartDate}
        selectedDate={reportStartDate}
        title="Seleccionar Fecha de Inicio"
      />
      
      <DatePicker
        visible={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        onDateSelect={setReportEndDate}
        selectedDate={reportEndDate}
        title="Seleccionar Fecha de Fin"
      />
    </View>
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
  success: '#28A745',
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
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.blue,
    marginTop: 2,
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
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    marginHorizontal: 2,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.blue,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  activeTabText: {
    color: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsRow: {
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
    marginBottom: 8,
    borderTopWidth: 3,
    borderTopColor: COLORS.blue,
    minWidth: '22%',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray,
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: COLORS.lightBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blue,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  appointmentDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    flex: 1,
  },
  appointmentInfo: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 4,
  },
  appointmentReason: {
    fontSize: 13,
    color: COLORS.dark,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  appointmentObservations: {
    fontSize: 12,
    color: COLORS.blue,
    fontStyle: 'italic',
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
  teacherCard: {
    backgroundColor: COLORS.lightBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teacherCardSelected: {
    borderColor: COLORS.blue,
    backgroundColor: '#F0F4FF',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  teacherSubject: {
    fontSize: 14,
    color: COLORS.blue,
    marginBottom: 4,
  },
  teacherEmail: {
    fontSize: 12,
    color: COLORS.gray,
  },
  teacherStats: {
    alignItems: 'center',
  },
  teacherStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.blue,
  },
  teacherStatLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  userCard: {
    backgroundColor: COLORS.lightBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  userCardInactive: {
    backgroundColor: '#FFF5F5',
    borderColor: COLORS.danger,
    opacity: 0.8,
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
  userNameInactive: {
    color: COLORS.gray,
    textDecorationLine: 'line-through',
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: COLORS.blue,
    fontWeight: '500',
    marginBottom: 4,
  },
  userSubject: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  userStatusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  userActions: {
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  reportButton: {
    backgroundColor: COLORS.blue,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  reportButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportStatsContainer: {
    backgroundColor: COLORS.lightBg,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  reportStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  reportStatsText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 16,
    paddingVertical: 32,
    fontStyle: 'italic',
  },
  loadingText: {
    color: COLORS.blue,
    marginTop: 12,
    fontSize: 16,
  },
  loadingDetail: {
    marginTop: 16,
    alignItems: 'center',
  },
  loadingDetailText: {
    color: COLORS.gray,
    fontSize: 14,
    marginBottom: 4,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  debugContainer: {
    backgroundColor: COLORS.lightBg,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  debugText: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.blue,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 300,
    marginBottom: 16,
  },
  modalAppointmentCard: {
    backgroundColor: COLORS.lightBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalCloseButton: {
    backgroundColor: COLORS.gray,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.dark,
    backgroundColor: COLORS.background,
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.lightBg,
    marginBottom: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.dark,
    flex: 1,
  },
  dateButtonIcon: {
    fontSize: 18,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  reportTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
  },
  reportTypeButtonSelected: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  reportTypeButtonText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  reportTypeButtonTextSelected: {
    color: COLORS.background,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalGenerateButton: {
    flex: 1,
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gray,
  },
  modalGenerateButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.background,
  },
});