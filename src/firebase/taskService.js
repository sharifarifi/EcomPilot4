import { db } from "./firebaseconfig";
import { sendNotification } from './notificationService'; // Bildirim servisi import edildi
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, query, orderBy, serverTimestamp, arrayUnion 
} from "firebase/firestore";

const TASKS_COLLECTION = "tasks";

// --- GÖREVLERİ DİNLE (Gerçek Zamanlı) ---
export const subscribeToTasks = (callback) => {
  const q = query(collection(db, TASKS_COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(tasks);
  });
};

// --- GÖREV EKLE (DÜZELTİLDİ: BİLDİRİM EKLENDİ) ---
export const addTask = async (taskData) => {
  try {
    // 1. Görevi Veritabanına Ekle
    await addDoc(collection(db, TASKS_COLLECTION), {
      ...taskData,
      status: 'Bekliyor',
      createdAt: serverTimestamp(),
      comments: [{
        id: Date.now(),
        user: 'Sistem',
        text: 'İş emri oluşturuldu.',
        type: 'log',
        time: new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})
      }]
    });

    // 2. Personele Bildirim Gönder (YENİ EKLENEN KISIM)
    if (taskData.assignee) {
        await sendNotification(
            taskData.assignee, 
            `Yeni bir görev atandı: "${taskData.title}"`, 
            'task'
        );
    }

  } catch (error) {
    console.error("Görev ekleme hatası:", error);
    throw error;
  }
};

// --- DURUM GÜNCELLE ---
export const updateTaskStatus = async (taskId, newStatus, userName) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    
    // Log mesajı ekle
    const logMessage = {
        id: Date.now(),
        user: 'Sistem',
        text: `${userName} durumu değiştirdi: ${newStatus}`,
        type: 'log',
        time: new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})
    };

    await updateDoc(taskRef, {
      status: newStatus,
      comments: arrayUnion(logMessage)
    });
  } catch (error) {
    console.error("Durum güncelleme hatası:", error);
    throw error;
  }
};

// --- YORUM EKLE ---
export const addTaskComment = async (taskId, comment) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, {
      comments: arrayUnion(comment)
    });
  } catch (error) {
    throw error;
  }
};

// --- SİL ---
export const deleteTask = async (taskId) => {
  try {
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
  } catch (error) {
    throw error;
  }
};