import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const DOC_REF = doc(db, "settings", "integrations");

// Tüm entegrasyonları tek seferde çek
export const getIntegrationSettings = async () => {
  try {
    const docSnap = await getDoc(DOC_REF);
    return docSnap.exists() ? docSnap.data() : {};
  } catch (error) {
    console.error("Entegrasyon ayarları çekilemedi:", error);
    throw error;
  }
};

// Tek bir entegrasyonu kaydet (Merge işlemi)
export const saveIntegration = async (appId, data) => {
  try {
    // Veriyi { trendyol: { ...data } } formatında merge eder
    await setDoc(DOC_REF, { [appId]: data }, { merge: true });
  } catch (error) {
    console.error("Entegrasyon kaydedilemedi:", error);
    throw error;
  }
};

// Canlı Dinleme
export const subscribeToIntegrations = (callback) => {
  return onSnapshot(DOC_REF, (doc) => {
    if (doc.exists()) callback(doc.data());
    else callback({});
  });
};