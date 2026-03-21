import { db } from "./firebaseConfig";
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, query, orderBy, serverTimestamp 
} from "firebase/firestore";

const REPORTS_COLLECTION = "daily_reports";

// --- RAPORLARI DİNLE ---
export const subscribeToReports = (callback) => {
  // En yeniden en eskiye sırala
  const q = query(collection(db, REPORTS_COLLECTION), orderBy("date", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        // Firestore Timestamp'i milisaniyeye çevir (Kilit kontrolü için)
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now() 
      };
    });
    callback(reports);
  });
};

// --- RAPOR EKLE ---
export const addReport = async (reportData) => {
  try {
    await addDoc(collection(db, REPORTS_COLLECTION), {
      ...reportData,
      createdAt: serverTimestamp() // Sunucu zamanı (Güvenlik için)
    });
  } catch (error) {
    console.error("Rapor ekleme hatası:", error);
    throw error;
  }
};

// --- RAPOR GÜNCELLE ---
export const updateReport = async (reportId, updatedData) => {
  const reportRef = doc(db, REPORTS_COLLECTION, reportId);
  await updateDoc(reportRef, updatedData);
};

// --- SİL ---
export const deleteReport = async (reportId) => {
  await deleteDoc(doc(db, REPORTS_COLLECTION, reportId));
  try {
    await deleteDoc(doc(db, REPORTS_COLLECTION, reportId));
  } catch (error) {
    throw error;
  }
};
