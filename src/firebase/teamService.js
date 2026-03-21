// DOSYA ADI: src/firebase/teamService.js
import { db, firebaseConfig } from "./firebaseconfig"; 
import { doc, setDoc, updateDoc, deleteDoc, collection, getDocs, getDoc } from "firebase/firestore";
import { initializeApp, deleteApp, getApps } from "firebase/app"; 
import { getAuth, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";

// --- VERİ ÇEKME (DÜZELTİLDİ: ID GARANTİSİ) ---
export const getAllTeamMembers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "team_members"));
    const list = [];
    querySnapshot.forEach((doc) => {
      // ÖNEMLİ DÜZELTME:
      // doc.data()'yı önce açıyoruz, sonra uid'yi doc.id olarak zorluyoruz.
      // Bu sayede veritabanındaki veri bozuk olsa bile ID her zaman dolu gelir.
      list.push({ 
          ...doc.data(), 
          uid: doc.id 
      });
    });
    return list;
  } catch (error) {
    console.error("Liste Hatası:", error);
    return [];
  }
};

// --- PERSONEL EKLEME ---
export const addTeamMember = async (memberData) => {
  let secondaryApp = null;
  try {
    if (!firebaseConfig) throw new Error("Firebase config hatası");

    // Temizlik
    const existingApps = getApps();
    const existingSecondaryApp = existingApps.find(app => app.name === "SecondaryApp");
    if (existingSecondaryApp) await deleteApp(existingSecondaryApp);

    // Yeni Uygulama Başlat
    secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);

    // Kullanıcı Oluştur
    const { password, ...otherData } = memberData;
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, memberData.email, password);
    const user = userCredential.user;
    const uid = user.uid;

    await updateProfile(user, { displayName: memberData.name });

    // Firestore Kaydı
    await setDoc(doc(db, "team_members", uid), {
      ...otherData,
      uid: uid, // ID'yi içeri de yazıyoruz
      createdAt: new Date().toISOString(),
      role: memberData.role || 'Personel',
      department: memberData.department || '',
      permissions: memberData.permissions || ['dashboard'] 
    });

    await signOut(secondaryAuth);
    return uid;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') throw new Error("E-posta kullanımda.");
    if (error.code === 'auth/weak-password') throw new Error("Şifre çok zayıf.");
    throw error;
  } finally {
    if (secondaryApp) {
        try {
            const appToDelete = getApps().find(app => app.name === "SecondaryApp");
            if (appToDelete) await deleteApp(appToDelete);
        } catch (e) { console.warn(e); }
    }
  }
};

// --- GÜNCELLEME ---
export const updateTeamMember = async (uid, updatedData) => {
  try {
    if (!uid) throw new Error("Güncellenecek ID yok.");
    const userRef = doc(db, "team_members", uid);
    await updateDoc(userRef, updatedData);
  } catch (error) {
    console.error("Güncelleme Hatası:", error);
    throw error;
  }
};

// --- SİLME ---
export const deleteTeamMember = async (uid) => {
  try {
    if (!uid) throw new Error("Silinecek ID yok.");
    // Sadece veritabanından siler (Auth'dan silmek için Admin SDK gerekir, bu yeterlidir)
    await deleteDoc(doc(db, "team_members", uid));
  } catch (error) {
    console.error("Silme Hatası:", error);
    throw error;
  }
};

// --- DEPARTMANLAR ---
const DEFAULT_DEPARTMENTS = [
  { id: 'social', label: 'Sosyal Medya', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'retail', label: 'Mağaza Satış', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'operation', label: 'Operasyon', color: 'bg-amber-100 text-amber-700' },
  { id: 'management', label: 'Yönetim', color: 'bg-slate-100 text-slate-700' },
];

export const getDepartments = async () => {
  try {
    const docRef = doc(db, "settings", "departments");
    const docSnap = await getDoc(docRef); 
    if (docSnap.exists()) {
      return docSnap.data().list || DEFAULT_DEPARTMENTS;
    }
    return DEFAULT_DEPARTMENTS;
  } catch (error) {
    return DEFAULT_DEPARTMENTS;
  }
};

export const saveDepartments = async (departmentList) => {
  try {
    const docRef = doc(db, "settings", "departments");
    await setDoc(docRef, { list: departmentList }, { merge: true });
  } catch (error) {
    throw error;
  }
};
// ... Diğer importlar ...
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

// ... Diğer fonksiyonlar ...

// --- ŞİFRE DEĞİŞTİRME ---
export const updateUserPassword = async (user, newPassword) => {
  try {
    await updatePassword(user, newPassword);
  } catch (error) {
    // Eğer kullanıcı oturumu çok eskiyse, Firebase güvenlik gereği yeniden giriş ister.
    if (error.code === 'auth/requires-recent-login') {
      throw new Error("Güvenlik nedeniyle şifre değiştirmek için çıkış yapıp tekrar giriş yapmalısınız.");
    }
    throw error;
  }
};