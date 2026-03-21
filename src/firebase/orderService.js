import { db } from "./firebaseConfig";
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, query, orderBy, serverTimestamp 
} from "firebase/firestore";

const ORDERS_COLLECTION = "orders";

// --- SİPARİŞLERİ DİNLE (Gerçek Zamanlı) ---
export const subscribeToOrders = (callback) => {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(orders);
  });
};

// --- SİPARİŞ EKLE ---
export const addOrder = async (orderData) => {
  try {
    await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      status: 'Onaylandı', // Varsayılan durum
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Sipariş ekleme hatası:", error);
    throw error;
  }
};

// --- SİPARİŞ GÜNCELLE ---
export const updateOrder = async (orderId, updatedData) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, updatedData);
  } catch (error) {
    console.error("Sipariş güncelleme hatası:", error);
    throw error;
  }
};

// --- DURUM GÜNCELLE ---
export const updateOrderStatus = async (orderId, newStatus) => {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(orderRef, { status: newStatus });
};

// --- SİL ---
export const deleteOrder = async (orderId) => {
  await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
  try {
    await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
  } catch (error) {
    throw error;
  }
};
