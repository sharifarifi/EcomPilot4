import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const getDocRef = () => doc(db, "settings", "general");

export const getGeneralSettings = async () => {
  const docSnap = await getDoc(getDocRef());
  return docSnap.exists() ? docSnap.data() : null;
};

export const saveGeneralSettings = async (data) => {
  await setDoc(getDocRef(), data, { merge: true });
};

export const subscribeToGeneralSettings = (callback) => {
  return onSnapshot(getDocRef(), (doc) => {
    if (doc.exists()) callback(doc.data());
  });
};
