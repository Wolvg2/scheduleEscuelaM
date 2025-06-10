// firebase/config.web.ts
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
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

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
onAuthStateChanged(auth, user =>
  console.log(user ? `✅ Sesión: ${user.uid}` : "🛑 Sin sesión")
);
export const db = getFirestore(app);
