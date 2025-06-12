// app/schedule.tsx
import { auth, db } from '@/firebase/config';
import { useSchedule } from '@/hooks/useSchedule';
import { Stack, router } from 'expo-router';
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/* FUNCIÓN DE NOTIFICACIÓN */
import { notifyAppointmentCreated } from '@/lib/notifications';

type TeacherSchedule = {
  id: string;
  name: string;
  availableSlots: Array<{ date: string; time: string }>;
};

export default function Schedule() {
  const [teacherSchedules, setTeacherSchedules] = useState<TeacherSchedule[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherSchedule | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [reason, setReason] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const { slots } = useSchedule(selectedTeacher?.id || '');

  /* ── Cargar profesores ──────────────────────────────── */
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const teachersQuery = query(collection(db, 'users'), where('role', '==', 'docente'));
        const querySnapshot = await getDocs(teachersQuery);
        const teachers: TeacherSchedule[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          teachers.push({
            id: doc.id,
            name: data.name,
            availableSlots: [],
          });
        });
        setTeacherSchedules(teachers);
      } catch (error) {
        console.error('Error al cargar profesores:', error);
      }
    };
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedTeacher && slots) {
      setSelectedTeacher((prev) => ({ ...prev!, availableSlots: slots }));
    }
  }, [slots, selectedTeacher?.id]);

  /* ── Selección de horario ───────────────────────────── */
  const handleSlotSelection = (slot: { date: string; time: string }) => {
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  /*  GUARDAR CITA + NOTIFICACIÓN INSTANTÁNEA*/
  const handleBookAppointment = async () => {
    if (!selectedTeacher || !selectedSlot || !reason.trim() || !auth.currentUser) {
      alert('Por favor completa todos los campos');
      return;
    }

    setIsBooking(true);
    try {
      const appointmentQuery = query(
        collection(db, 'appointments'),
        where('docenteId', '==', selectedTeacher.id),
        where('date', '==', selectedSlot.date),
        where('time', '==', selectedSlot.time),
      );
      const existing = await getDocs(appointmentQuery);
      if (!existing.empty) {
        alert('El horario seleccionado no está disponible');
        setIsBooking(false);
        return;
      }

      await addDoc(collection(db, 'appointments'), {
        tutorId: auth.currentUser.uid,
        docenteId: selectedTeacher.id,
        docenteName: selectedTeacher.name,
        date: selectedSlot.date,
        time: selectedSlot.time,
        reason: reason.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      await notifyAppointmentCreated(
        selectedTeacher.name,
        new Date(`${selectedSlot.date}T${selectedSlot.time}`),
        reason.trim(),
      );

      setShowBookingModal(false);
      setSelectedSlot(null);
      setReason('');
      alert('Cita agendada exitosamente');
      router.back();
    } catch (error) {
      console.error('Error al agendar cita:', error);
      alert('Error al agendar cita. Por favor intenta nuevamente.');
    } finally {
      setIsBooking(false);
    }
  };

  /* ── Helpers ─────────────────────────────────────────── */
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  /* ── Modal de confirmación ───────────────────────────── */
  const renderBookingModal = () => (
    <Modal
      visible={showBookingModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowBookingModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Confirmar Cita</Text>

          {selectedSlot && selectedTeacher && (
            <View style={styles.appointmentSummary}>
              <Text style={styles.summaryLabel}>Profesor:</Text>
              <Text style={styles.summaryValue}>{selectedTeacher.name}</Text>

              <Text style={styles.summaryLabel}>Fecha:</Text>
              <Text style={styles.summaryValue}>{formatDate(selectedSlot.date)}</Text>

              <Text style={styles.summaryLabel}>Hora:</Text>
              <Text style={styles.summaryValue}>{selectedSlot.time}</Text>
            </View>
          )}

          <Text style={styles.inputLabel}>Motivo de la cita:</Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="Describe brevemente el motivo de tu cita..."
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
          <Text style={styles.characterCount}>{reason.length}/200</Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowBookingModal(false);
                setSelectedSlot(null);
                setReason('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleBookAppointment}
              disabled={isBooking || !reason.trim()}
            >
              <Text style={styles.confirmButtonText}>
                {isBooking ? 'Agendando…' : 'Confirmar Cita'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  /* ── UI principal ───────────────────────────────────── */
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Agendar cita' }} />

      {/* Lista de profesores */}
      <Text style={styles.sectionTitle}>Selecciona un profesor</Text>
      <FlatList
        horizontal
        data={teacherSchedules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.teacherCard,
              selectedTeacher?.id === item.id && styles.teacherCardSelected,
            ]}
            onPress={() => setSelectedTeacher(item)}
          >
            <Text style={styles.teacherName}>{item.name}</Text>
            {selectedTeacher?.id === item.id && (
              <Text style={styles.teacherSubtitle}>
                {slots?.length || 0} horarios disponibles
              </Text>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Horarios disponibles */}
      {selectedTeacher && slots && slots.length > 0 && (
        <View style={styles.slotsContainer}>
          <Text style={styles.sectionTitle}>
            Horarios disponibles - {selectedTeacher.name}
          </Text>

          <FlatList
            data={slots}
            keyExtractor={(item, index) => `${item.date}-${item.time}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.slotCard,
                  selectedSlot?.date === item.date &&
                    selectedSlot?.time === item.time &&
                    styles.slotSelected,
                ]}
                onPress={() => handleSlotSelection(item)}
              >
                <View style={styles.slotInfo}>
                  <Text style={styles.slotDate}>{formatDate(item.date)}</Text>
                  <Text style={styles.slotTime}>🕐 {item.time}</Text>
                </View>
                <Text style={styles.slotArrow}>→</Text>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Empty states */}
      {!selectedTeacher && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👨‍🏫</Text>
          <Text style={styles.emptyTitle}>Selecciona un profesor</Text>
          <Text style={styles.emptySubtitle}>
            Elige un profesor para ver sus horarios disponibles
          </Text>
        </View>
      )}
      {selectedTeacher && (!slots || slots.length === 0) && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>Sin horarios disponibles</Text>
          <Text style={styles.emptySubtitle}>
            {selectedTeacher.name} no tiene horarios disponibles en este momento
          </Text>
        </View>
      )}

      {renderBookingModal()}
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
  white: '#FFFFFF',
  border: '#E0E0E0',
};

const styles = StyleSheet.create({
  /* contenedor y título */
  container: { flex: 1, backgroundColor: COLORS.lightBg, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: COLORS.dark },

  /* tarjetas de profesor */
  teacherCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teacherCardSelected: { borderColor: COLORS.blue, backgroundColor: '#F0F4FF' },
  teacherName: { fontSize: 14, fontWeight: 'bold', color: COLORS.dark, marginBottom: 4 },
  teacherSubtitle: { fontSize: 12, color: COLORS.blue },

  /* slots */
  slotsContainer: { marginBottom: 24 },
  slotCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  slotSelected: { borderColor: COLORS.green, backgroundColor: '#F0FFF4' },
  slotInfo: { flex: 1 },
  slotDate: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, textTransform: 'capitalize' },
  slotTime: { fontSize: 14, color: COLORS.gray },
  slotArrow: { fontSize: 18, color: COLORS.gray },

  /* empty */
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },

  /* modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark, marginBottom: 20, textAlign: 'center' },
  appointmentSummary: { backgroundColor: COLORS.lightBg, padding: 16, borderRadius: 12, marginBottom: 20 },
  summaryLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.gray, marginBottom: 4 },
  summaryValue: { fontSize: 16, color: COLORS.dark, marginBottom: 12 },
  inputLabel: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, marginBottom: 8 },
  reasonInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  characterCount: { fontSize: 12, color: COLORS.gray, textAlign: 'right', marginTop: 4, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: COLORS.lightBg, borderWidth: 1, borderColor: COLORS.border },
  confirmButton: { backgroundColor: COLORS.green },
  cancelButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray },
  confirmButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
});
