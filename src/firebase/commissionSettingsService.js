import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const getDocRef = () => doc(db, "settings", "commissions");

export const getCommissionSettings = async () => {
  try {
    const docSnap = await getDoc(getDocRef());
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Prim ayarları çekilemedi:", error);
    throw error;
  }
};

export const saveCommissionSettings = async (data) => {
  try {
    await setDoc(getDocRef(), data, { merge: true });
  } catch (error) {
    console.error("Prim ayarları kaydedilemedi:", error);
    throw error;
  }
};

export const subscribeToCommissionSettings = (callback) => {
  return onSnapshot(getDocRef(), (doc) => {
    if (doc.exists()) callback(doc.data());
    else callback(null);
  });
};
