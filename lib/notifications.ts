import * as Notifications from 'expo-notifications';


export async function notifyAppointmentCreated(
  teacher: string,
  startsAt: Date,
  reason: string
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '¡Cita agendada!',
      body: `Con ${teacher} a las ${startsAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}. Motivo: ${reason}`,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
    },
  });
}


export async function scheduleAppointmentReminder(
  appointmentId: string,
  startsAt: Date
) {
  const seconds =
    Math.floor((startsAt.getTime() - Date.now()) / 1000) - 5 * 60;
  if (seconds <= 0) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tu cita es en 5 min',
      body: 'Toca para ver los detalles',
      sound: 'default',
      data: { appointmentId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}
