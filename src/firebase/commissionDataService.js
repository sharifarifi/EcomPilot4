import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

// Veritabanı Yolu: commissions / {YIL-AY} / staff_records / {USER_ID}

// Belirli bir ayın (örn: '2024-03') personel verisini getir
export const getStaffMonthlyData = async (userId, monthKey) => {
  try {
    const docRef = doc(db, "commissions", monthKey, "staff_records", userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Personel verisi çekilemedi:", error);
    throw error;
  }
};

// Personelin o ayki satış verilerini kaydet/güncelle
export const saveStaffMonthlyData = async (userId, monthKey, data) => {
  try {
    const docRef = doc(db, "commissions", monthKey, "staff_records", userId);
    // lastUpdated ekleyelim ki ne zaman değiştiğini bilelim
    await setDoc(docRef, { ...data, lastUpdated: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error("Veri kaydedilemedi:", error);
    throw error;
  }
};

// O ayın tüm personel verilerini getir (Lider tablosu için)
export const getMonthSummary = async (monthKey) => {
  try {
    const querySnapshot = await getDocs(collection(db, "commissions", monthKey, "staff_records"));
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return list;
  } catch (error) {
    console.error("Ay özeti çekilemedi:", error);
    return [];
  }
};
// YENİ: Belirli bir ayın TÜM personel verilerini getir
export const getAllStaffMonthlyData = async (monthKey) => {
  try {
    // "commissions/2024-01/staff_records" koleksiyonundaki tüm belgeleri çek
    const colRef = collection(db, "commissions", monthKey, "staff_records");
    const querySnapshot = await getDocs(colRef);
    
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return list;
  } catch (error) {
    console.error("Tüm personel verisi çekilemedi:", error);
    return [];
  }
};
