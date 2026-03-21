import { db, auth } from "./firebaseConfig";
import { doc, setDoc, updateDoc, collection, onSnapshot, deleteDoc, getDocs } from "firebase/firestore"; // getDocs eklendi
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

// 1. KULLANICI EKLE
export const addUser = async (userData, password) => {
  try {
    // Auth'ta kullanıcı oluştur
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
    const uid = userCredential.user.uid;

    await updateProfile(userCredential.user, { displayName: userData.name });

    // Firestore'a kaydet
    await setDoc(doc(db, "users", uid), {
      id: uid,
      ...userData,
      avatarColor: 'bg-slate-200 text-slate-600', // Varsayılan renk
      status: 'active',
      createdAt: new Date().toISOString()
    });

    return uid;
  } catch (error) {
    console.error("Kullanıcı eklenemedi:", error);
    throw error;
  }
};

// 2. CANLI DİNLEME (Listeyi sürekli güncel tutar)
export const subscribeToUsers = (callback) => {
  const q = collection(db, "users");
  return onSnapshot(q, (snapshot) => {
    const userList = [];
    snapshot.forEach((doc) => {
      userList.push(doc.data());
    });
    callback(userList);
  });
};

// 3. TÜM KULLANICILARI ÇEK (YENİ EKLENDİ - Hata Çözümü İçin)
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data());
    });
    return users;
  } catch (error) {
    console.error("Kullanıcılar çekilemedi:", error);
    throw error;
  }
};

// 4. GÜNCELLE
export const updateUser = async (uid, data) => {
  try {
    await updateDoc(doc(db, "users", uid), data);
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    throw error;
  }
};

// 5. SİL
export const deleteUser = async (uid) => {
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (error) {
    console.error("Silme hatası:", error);
    throw error;
  }
};