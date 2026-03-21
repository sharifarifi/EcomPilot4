import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const DOC_REF = doc(db, "settings", "general");

export const getGeneralSettings = async () => {
  const docSnap = await getDoc(DOC_REF);
  return docSnap.exists() ? docSnap.data() : null;
};

export const saveGeneralSettings = async (data) => {
  await setDoc(DOC_REF, data, { merge: true });
};

export const subscribeToGeneralSettings = (callback) => {
  return onSnapshot(DOC_REF, (doc) => {
    if (doc.exists()) callback(doc.data());
  });
};