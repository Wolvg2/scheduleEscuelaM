import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  TextInput,
  Button,
  Modal
} from 'react-native';
import { useSchedule } from '@/hooks/useSchedule';
import { useAppointments } from '@/hooks/useAppointments';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

type Appointment = {
  id: string;
  docenteId: string;
  tutorId: string;
  tutorName?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  reason?: string;
  subject?: string;
};

export default function HomeDocente() {
  const { slots, updateAvailableSlots } = useSchedule(auth.currentUser?.uid || '');
  const { appointments, loading } = useAppointments(auth.currentUser?.uid || '', 'docente');

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [localSlots, setLocalSlots] = useState(slots);
  const [selectedView, setSelectedView] = useState<'slots' | 'appointments' | 'schedule'>('appointments');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [processingAppointment, setProcessingAppointment] = useState(false);

  // Cargar horarios del docente
  useEffect(() => {
    setLocalSlots(slots);
  }, [slots]);

  const handleAppointmentAction = async (appointment: Appointment, action: 'confirmed' | 'cancelled') => {
    setProcessingAppointment(true);
    try {
      const appointmentRef = doc(db, 'appointments', appointment.id);
      await updateDoc(appointmentRef, {
        status: action,
        updatedAt: new Date().toISOString(),
      });

      alert(`Cita ${action === 'confirmed' ? 'confirmada' : 'cancelada'} exitosamente`);

      setShowAppointmentDetails(false);
    } catch (error) {
      console.error("Error al actualizar cita:", error);
      alert("Error al actualizar la cita");
    } finally {
      setProcessingAppointment(false);
    }
  };

  const handleAddSlot = () => {
    if (date && time) {
      setLocalSlots([...localSlots, { date, time }]);
      setDate("");
      setTime("");
    }
  };

  const handleRemoveSlot = (index: number) => {
    const updatedSlots = localSlots.filter((_, idx) => idx !== index);
    setLocalSlots(updatedSlots);
  };

  const handleSaveSlots = async () => {
    try {
      await updateAvailableSlots(localSlots);
      alert("Horarios actualizados exitosamente");
    } catch (error) {
      console.error("Error al guardar horarios:", error);
      alert("Error al guardar horarios");
    }
  };

  const showAppointmentDetailsModal = async (appointment: Appointment) => {
    try {
      const tutorDoc = await getDoc(doc(db, 'users', appointment.tutorId));
      const tutorName = tutorDoc.data()?.name || 'Desconocido';
      setSelectedAppointment({
        ...appointment,
        tutorName,
      });

      setShowAppointmentDetails(true);
    } catch (error) {
      console.error("Error al obtener detalles de la cita:", error);
      alert("Error al obtener detalles de la cita");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAppointmentsByStatus = () => {
    const pending = appointments.filter(apt => apt.status === 'pending');
    const confirmed = appointments.filter(apt => apt.status === 'confirmed');
    const cancelled = appointments.filter(apt => apt.status === 'cancelled');
    return { pending, confirmed, cancelled };
  };

  const { pending, confirmed, cancelled } = getAppointmentsByStatus();

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <TouchableOpacity 
      style={styles.appointmentCard}
      onPress={() => showAppointmentDetailsModal(item)}
    >
      <View style={styles.appointmentHeader}>
        <Text style={styles.appointmentDate}>
          {formatDate(item.date)}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: 
            item.status === 'confirmed' ? '#8FC027' :
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
        <Text style={styles.appointmentReason} numberOfLines={2}>
          📝 {item.reason}
        </Text>
      )}
      
      <Text style={styles.appointmentTutor}>
        👤 Solicitada por tutor
      </Text>
    </TouchableOpacity>
  );

  const renderAppointmentModal = () => (
    <Modal
      visible={showAppointmentDetails}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAppointmentDetails(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Detalles de la Cita</Text>
          
          {selectedAppointment && (
            <View style={styles.appointmentDetails}>
              <Text style={styles.detailLabel}>Tutor:</Text>
              <Text style={styles.detailValue}>
                {selectedAppointment.tutorName || 'Cargando...'}
              </Text>
              
              <Text style={styles.detailLabel}>Fecha:</Text>
              <Text style={styles.detailValue}>
                {formatDate(selectedAppointment.date)}
              </Text>
              
              <Text style={styles.detailLabel}>Hora:</Text>
              <Text style={styles.detailValue}>{selectedAppointment.time}</Text>
              
              <Text style={styles.detailLabel}>Motivo:</Text>
              <Text style={styles.detailValue}>
                {selectedAppointment.reason || 'Sin motivo especificado'}
              </Text>
              
              <Text style={styles.detailLabel}>Estado:</Text>
              <Text style={[
                styles.detailValue,
                { color: 
                  selectedAppointment.status === 'confirmed' ? '#8FC027' :
                  selectedAppointment.status === 'cancelled' ? '#FF6B6B' : '#FFA500'
                }
              ]}>
                {selectedAppointment.status === 'pending' ? 'Pendiente' :
                 selectedAppointment.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
              </Text>
            </View>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelModalButton]}
              onPress={() => setShowAppointmentDetails(false)}
            >
              <Text style={styles.cancelModalButtonText}>Cerrar</Text>
            </TouchableOpacity>
            
            {selectedAppointment?.status === 'pending' && (
              <>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.rejectButton]}
                  onPress={() => handleAppointmentAction(selectedAppointment, 'cancelled')}
                  disabled={processingAppointment}
                >
                  <Text style={styles.rejectButtonText}>
                    {processingAppointment ? 'Procesando...' : 'Rechazar'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={() => handleAppointmentAction(selectedAppointment, 'confirmed')}
                  disabled={processingAppointment}
                >
                  <Text style={styles.confirmButtonText}>
                    {processingAppointment ? 'Procesando...' : 'Confirmar'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderScheduleManagement = () => (
    <View style={styles.scheduleContainer}>
      <Text style={styles.sectionTitle}>Gestionar Horarios Disponibles</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Fecha (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          style={styles.input}
        />
        <TextInput
          placeholder="Hora (HH:mm)"
          value={time}
          onChangeText={setTime}
          style={styles.input}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddSlot}>
          <Text style={styles.addButtonText}>Agregar Horario</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={localSlots}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.slotRow}>
            <View style={styles.slotInfo}>
              <Text style={styles.slotText}>📅 {formatDate(item.date)}</Text>
              <Text style={styles.slotText}>🕐 {item.time}</Text>
            </View>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => handleRemoveSlot(index)}
            >
              <Text style={styles.removeButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay horarios agregados.</Text>
        }
        style={styles.slotsList}
      />
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveSlots}>
        <Text style={styles.saveButtonText}>Guardar Horarios</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAppointmentsView = () => (
    <View style={styles.appointmentsContainer}>
      <Text style={styles.sectionTitle}>Gestión de Citas</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3A557C" />
          <Text style={styles.loadingText}>Cargando citas...</Text>
        </View>
      ) : (
        <>
          {/* Pending Appointments */}
          {pending.length > 0 && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>
                Pendientes de Aprobar ({pending.length})
              </Text>
              <FlatList
                data={pending}
                keyExtractor={(item) => item.id}
                renderItem={renderAppointment}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {/* Confirmed Appointments */}
          {confirmed.length > 0 && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>
                Citas Confirmadas ({confirmed.length})
              </Text>
              <FlatList
                data={confirmed}
                keyExtractor={(item) => item.id}
                renderItem={renderAppointment}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {/* Empty State */}
          {appointments.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No tienes citas</Text>
              <Text style={styles.emptySubtitle}>
                Las citas solicitadas por tutores aparecerán aquí
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel Docente</Text>
        <View style={styles.profileDot} />
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedView === 'appointments' && styles.activeTab]}
          onPress={() => setSelectedView('appointments')}
        >
          <Text style={[styles.tabText, selectedView === 'appointments' && styles.activeTabText]}>
            Citas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedView === 'schedule' && styles.activeTab]}
          onPress={() => setSelectedView('schedule')}
        >
          <Text style={[styles.tabText, selectedView === 'schedule' && styles.activeTabText]}>
            Horarios
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on selected view */}
      {selectedView === 'appointments' && renderAppointmentsView()}
      {selectedView === 'schedule' && renderScheduleManagement()}

      {/* Appointment Details Modal */}
      {renderAppointmentModal()}

      {/* Quick Stats */}
      {appointments.length > 0 && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{pending.length}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{confirmed.length}</Text>
              <Text style={styles.statLabel}>Confirmadas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{localSlots.length}</Text>
              <Text style={styles.statLabel}>Horarios</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

/* ---------- STYLES ---------- */
const COLORS = {
  blue: '#3A557C',
  green: '#8FC027',
  gray: '#A6A6A6',
  background: '#FFFFFF',
  dark: '#111111',
  text: '#333333',
  border: '#CCCCCC',
  lightBg: '#F8F9FA',
  danger: '#FF6B6B',
  warning: '#FFA500',
  success: '#28A745',
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
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  profileDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.gray,
  },

  /* Navigation Tabs */
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
    color: COLORS.text,
  },
  activeTabText: {
    color: COLORS.background,
  },

  /* Sections */
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  subsection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 12,
  },

  /* Appointments */
  appointmentsContainer: {
    paddingBottom: 24,
  },
  appointmentCard: {
    backgroundColor: COLORS.lightBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blue,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
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
  appointmentTutor: {
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

  /* Schedule Management */
  scheduleContainer: {
    paddingBottom: 24,
  },
  inputContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  slotsList: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.lightBg,
    marginBottom: 8,
    borderRadius: 8,
  },
  slotInfo: {
    flex: 1,
  },
  slotText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 2,
  },
  removeButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: COLORS.blue,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* Modal */
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 20,
    textAlign: 'center',
  },
  appointmentDetails: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginBottom: 4,
    marginTop: 8,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: COLORS.lightBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confirmButton: {
    backgroundColor: COLORS.green,
  },
  rejectButton: {
    backgroundColor: COLORS.danger,
  },
  cancelModalButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gray,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.background,
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

  /* Empty States */
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
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 16,
    paddingVertical: 20,
  },

  /* Stats */
  statsSection: {
    paddingBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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