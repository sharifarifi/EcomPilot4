import { db } from "./firebaseconfig";
import { 
  collection, addDoc, updateDoc, doc, 
  onSnapshot, query, where, orderBy, serverTimestamp 
} from "firebase/firestore";

const NOTIF_COLLECTION = "notifications";

// --- BİLDİRİM GÖNDER (Sistem Kullanır) ---
export const sendNotification = async (recipientId, message, type = 'info') => {
  try {
    await addDoc(collection(db, NOTIF_COLLECTION), {
      recipientId,   // Kime gidecek?
      message,       // Ne yazacak?
      type,          // 'task', 'alert', 'info'
      isRead: false, // Okundu mu?
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Bildirim gönderilemedi:", error);
  }
};

// --- BİLDİRİMLERİ DİNLE (Kullanıcı İçin) ---
export const subscribeToNotifications = (userId, callback) => {
  // Sadece bana gelen ve okunmamış veya yeni olanları getir (Son 20)
  const q = query(
    collection(db, NOTIF_COLLECTION), 
    where("recipientId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notifs);
  });
};

// --- OKUNDU İŞARETLE ---
export const markNotificationAsRead = async (notifId) => {
  try {
    const notifRef = doc(db, NOTIF_COLLECTION, notifId);
    await updateDoc(notifRef, { isRead: true });
  } catch (error) {
    console.error("Okundu hatası:", error);
  }
};