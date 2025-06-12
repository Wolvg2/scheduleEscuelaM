// firebase/config.native.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGINGSENDERID!,
  appId: process.env.EXPO_PUBLIC_APPID!,
  measurementId: process.env.EXPO_PUBLIC_MEASUREMENTID!
};

// Initialize Firebase app only if it hasn't been initialized
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth with proper persistence
let auth;
try {
  auth = getAuth(app);
} catch (error) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Firestore
const db = getFirestore(app);

// Optional: Auth state listener (you can remove this if not needed)
auth.onAuthStateChanged(user => {
  console.log(user ? `✅ Sesión: ${user.uid}` : "🛑 Sin sesión");
});

export { app, auth, db };