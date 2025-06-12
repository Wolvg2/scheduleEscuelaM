// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { registerForNotifications } from '@/hooks/useNotifications';
import * as Notifications from 'expo-notifications';

/* Handler foreground actualizado */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    registerForNotifications();
  }, []);

  /* Listener tap → navega cuando ya tengas la ruta dinámica */
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const appointmentId = res.notification.request.content.data?.appointmentId as string | undefined;
      if (appointmentId) {
        router.push({
          pathname: '/appointment/[id]',     // ➜ crea app/appointment/[id].tsx
          params: { id: appointmentId },
        });
      }
    });
    return () => sub.remove();
  }, []);

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* ...tus screens... */}
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
