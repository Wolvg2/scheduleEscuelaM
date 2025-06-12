// hooks/useNotifications.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

/**
 * Pide permiso de notificaciones y crea el canal “reminders”.
 * Devuelve true cuando todo queda listo, false si el usuario negó permisos.
 */
export async function registerForNotifications(): Promise<boolean> {

  if (!Device.isDevice) {
    console.log('[Notif] Simulador detectado: saltando registro');
    return false;
  }


  let { status } = await Notifications.getPermissionsAsync();


  if (status !== 'granted') {
    const res = await Notifications.requestPermissionsAsync();
    status = res.status;
    if (status !== 'granted') {
      console.log('[Notif] El usuario negó permisos');
      return false;
    }
  }


  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Recordatorios',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });

  console.log('[Notif] Permiso concedido y canal listo');
  return true;
}
