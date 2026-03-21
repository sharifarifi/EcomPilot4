import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const requiredFirebaseEnvVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missingFirebaseEnvVars = requiredFirebaseEnvVars.filter((envVar) => {
  const value = import.meta.env[envVar];
  return typeof value !== "string" || value.trim() === "";
});

if (missingFirebaseEnvVars.length > 0) {
  throw new Error(
    [
      "Firebase yapılandırması eksik veya geçersiz.",
      "Aşağıdaki Vite environment değişkenlerini tanımlayın:",
      ...missingFirebaseEnvVars.map((envVar) => `- ${envVar}`),
      "Örnek: .env.local veya dağıtım ortamı değişkenleri.",
    ].join("\n")
  );
}

// 'export' kelimesi KRİTİK ÖNEME SAHİPTİR.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Uygulamayı başlat
const app = initializeApp(firebaseConfig);

// Servisleri dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
