// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      // SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{
            title: 'Bienvenido',
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="login" 
          options={{
            title: 'Iniciar Sesión',
            headerShown: true,
            headerBackVisible: true,
          }}
        />
        <Stack.Screen 
          name="home" 
          options={{
            title: 'Inicio',
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="homeDocente" 
          options={{
            title: 'Panel Docente',
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="homeAdmin" 
          options={{
            title: 'Panel Admin',
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="schedule" 
          options={{
            title: 'Agendar Cita',
            headerShown: true,
            headerBackVisible: true,
          }}
        />
        <Stack.Screen 
          name="+not-found" 
          options={{
            title: 'Página no encontrada'
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}