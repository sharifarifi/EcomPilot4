import { db } from "./firebaseConfig";
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, query, orderBy, serverTimestamp, where 
} from "firebase/firestore";

const LEAVES_COLLECTION = "leaves";
const LEAVE_EDITABLE_FIELDS = ['type', 'start', 'end', 'days', 'reason', 'note'];

// --- İZİNLERİ DİNLE ---
export const subscribeToLeaves = (callback, options = {}) => {
  const { uid, isManagement = false } = options;
  if (!isManagement && !uid) {
    callback([]);
    return () => {};
  }

  const q = isManagement
    ? query(collection(db, LEAVES_COLLECTION), orderBy("createdAt", "desc"))
    : query(
        collection(db, LEAVES_COLLECTION),
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );

  return onSnapshot(q, (snapshot) => {
    const leaves = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(leaves);
  });
};

// --- YENİ İZİN TALEBİ ---
export const addLeaveRequest = async (leaveData) => {
  try {
    await addDoc(collection(db, LEAVES_COLLECTION), {
      ...leaveData,
      status: 'Bekliyor', // Yeni talep her zaman 'Bekliyor' olarak başlar
      requestDate: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("İzin talebi hatası:", error);
    throw error;
  }
};

// --- İZİN DURUMU GÜNCELLE (Onayla / Reddet) ---
export const updateLeaveStatus = async (leaveId, newStatus) => {
  try {
    const leaveRef = doc(db, LEAVES_COLLECTION, leaveId);
    await updateDoc(leaveRef, { status: newStatus });
  } catch (error) {
    console.error("İzin güncellenemedi:", error);
    throw error;
  }
};

// --- İZİN DÜZENLE ---
export const updateLeave = async (leaveId, updatedData) => {
  try {
    const leaveRef = doc(db, LEAVES_COLLECTION, leaveId);
    const payload = Object.fromEntries(
      Object.entries(updatedData || {}).filter(([key, value]) => (
        LEAVE_EDITABLE_FIELDS.includes(key) && value !== undefined
      ))
    );
    await updateDoc(leaveRef, payload);
  } catch (error) {
    console.error("İzin güncellenemedi:", error);
    throw error;
  }
};

// --- İZİN SİL ---
export const deleteLeaveRequest = async (leaveId) => {
  try {
    await deleteDoc(doc(db, LEAVES_COLLECTION, leaveId));
  } catch (error) {
    console.error("İzin silinemedi:", error);
    throw error;
  }
};
