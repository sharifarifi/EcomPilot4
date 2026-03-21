import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 'export' kelimesi KRİTİK ÖNEME SAHİPTİR.
export const firebaseConfig = {
  apiKey: "AIzaSyDzN7UmABmW6-n41EE5hdDG3KjA_zb8nBA",
  authDomain: "ecom-prototip.firebaseapp.com",
  projectId: "ecom-prototip",
  storageBucket: "ecom-prototip.firebasestorage.app",
  messagingSenderId: "873085135670",
  appId: "1:873085135670:web:7b760ccfaa97d7bd136197"
};

// Uygulamayı başlat
const app = initializeApp(firebaseConfig);

// Servisleri dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;