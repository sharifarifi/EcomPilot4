import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

// Ayarları 'settings' koleksiyonunda 'operations' dökümanı olarak tutuyoruz
const getDocRef = () => doc(db, "settings", "operations");

export const getOperationSettings = async () => {
  try {
    const docSnap = await getDoc(getDocRef());
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Operasyon ayarları çekilemedi:", error);
    throw error;
  }
};

export const saveOperationSettings = async (data) => {
  try {
    // merge: true -> Var olan diğer alanları silmeden güncelle
    await setDoc(getDocRef(), data, { merge: true });
  } catch (error) {
    console.error("Operasyon ayarları kaydedilemedi:", error);
    throw error;
  }
};

export const subscribeToOperationSettings = (callback) => {
  return onSnapshot(getDocRef(), (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      // Döküman henüz yoksa (ilk kurulum), boş dön
      callback(null);
    }
  });
};
