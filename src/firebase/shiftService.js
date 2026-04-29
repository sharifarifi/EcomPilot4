import { db } from "./firebaseConfig";
import { 
  collection, addDoc, updateDoc, doc, getDocs,
  onSnapshot, query, where, orderBy, serverTimestamp, limit 
} from "firebase/firestore";

const SHIFTS_COLLECTION = "shifts";
const SHIFT_UPDATE_ALLOWED_FIELDS = ['checkOut', 'status', 'breaks', 'note', 'updatedAt'];

// --- VARDİYALARI DİNLE (Gerçek Zamanlı) ---
export const subscribeToShifts = (callback, options = {}) => {
  const { uid, isManagement = false } = options;
  if (!isManagement && !uid) {
    callback([]);
    return () => {};
  }

  // Sadece son 30 günlük veriyi getir (Performans için)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateString = thirtyDaysAgo.toISOString().split('T')[0];

  const q = isManagement
    ? query(
        collection(db, SHIFTS_COLLECTION), 
        where("date", ">=", dateString),
        orderBy("date", "desc")
      )
    : query(
        collection(db, SHIFTS_COLLECTION),
        where("userId", "==", uid),
        where("date", ">=", dateString),
        orderBy("date", "desc")
      );

  return onSnapshot(q, (snapshot) => {
    const shifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(shifts);
  });
};

// --- GÜNLÜK KAYIT KONTROLÜ (Bugün giriş yaptı mı?) ---
export const getTodayShiftByUser = async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
        collection(db, SHIFTS_COLLECTION),
        where("userId", "==", userId),
        where("date", "==", today),
        limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
};

// --- YENİ GİRİŞ YAP (Check-In) ---
export const checkIn = async (shiftData) => {
  try {
    const docRef = await addDoc(collection(db, SHIFTS_COLLECTION), {
      ...shiftData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Giriş hatası:", error);
    throw error;
  }
};

// --- ÇIKIŞ YAP (Check-Out) VEYA MOLA GÜNCELLE ---
export const updateShift = async (shiftId, updateData) => {
  try {
    const payload = Object.fromEntries(
      Object.entries(updateData || {}).filter(([key, value]) => (
        SHIFT_UPDATE_ALLOWED_FIELDS.includes(key) && value !== undefined
      ))
    );

    const shiftRef = doc(db, SHIFTS_COLLECTION, shiftId);
    await updateDoc(shiftRef, payload);
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    throw error;
  }
};
