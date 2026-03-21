import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null); // Veritabanındaki detaylı bilgiler (Rol, Yetki)
  const [loading, setLoading] = useState(true);

  // GÜVENLİ GİRİŞ
  const login = async (email, password) => {
    // 1. Önce Firebase Auth ile giriş dene
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Sonra Veritabanını Kontrol Et (Yönetici silmiş mi?)
    const docRef = doc(db, "team_members", user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Eğer veritabanında kaydı yoksa (silinmişse) oturumu hemen kapat
      await signOut(auth);
      throw new Error("Hesabınız yönetici tarafından silinmiştir veya erişim izniniz yoktur.");
    }

    return user;
  };

  const logout = () => {
    setUserData(null);
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Kullanıcı giriş yaptıysa, yetkilerini veritabanından çek
        try {
          const docRef = doc(db, "team_members", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserData(docSnap.data()); // Yetkileri State'e at
            setCurrentUser(user);
          } else {
            // Veritabanında yoksa at
            await signOut(auth);
            setCurrentUser(null);
            setUserData(null);
          }
        } catch (err) {
          console.error("Kullanıcı verisi çekilemedi", err);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData, // Artık bu objenin içinde permissions var!
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};