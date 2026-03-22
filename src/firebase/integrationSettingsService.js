import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const getDocRef = () => doc(db, "settings", "integrations");
const SHOPIFY_APP_ID = 1;

const pickTruthyKeys = (record = {}) => (
  Object.entries(record)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key)
);

const buildShopifySyncPreferences = (advancedSettings = {}) => {
  const allowedSettings = [
    "initial_sync_range_days",
    "sync_orders",
    "sync_products",
    "sync_customers",
    "sync_inventory",
    "webhooks_enabled",
    "auto_resync_on_error",
    "default_fulfillment_location_id",
  ];

  return allowedSettings.reduce((acc, key) => {
    if (!(key in advancedSettings)) return acc;

    const settingValue = advancedSettings[key];
    acc[key] = settingValue?.value ?? settingValue ?? null;
    return acc;
  }, {});
};

const sanitizeShopifyIntegration = (data = {}) => {
  const connectionState = data.connectionState ?? data.status ?? (data.connected ? "connected" : "disconnected");
  const connected = data.connected ?? connectionState === "connected";
  const shopDomain = data.shopDomain ?? data.fields?.shopUrl ?? "";
  const enabledModules = Array.isArray(data.enabledModules) ? data.enabledModules : pickTruthyKeys(data.permissions);
  const syncPreferences = data.syncPreferences ?? buildShopifySyncPreferences(data.advancedSettings);

  return {
    connectionState,
    connected,
    status: connectionState,
    shopDomain,
    lastSyncAt: data.lastSyncAt ?? null,
    lastError: data.lastError ?? null,
    enabledModules,
    syncPreferences,
    updatedAt: data.updatedAt ?? null,
    logs: Array.isArray(data.logs) ? data.logs : [],
  };
};

const sanitizeIntegrationData = (appId, data) => {
  if (String(appId) === String(SHOPIFY_APP_ID)) {
    return sanitizeShopifyIntegration(data);
  }

  return data;
};

// Tüm entegrasyonları tek seferde çek
export const getIntegrationSettings = async () => {
  try {
    const docSnap = await getDoc(getDocRef());
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
    await setDoc(getDocRef(), { [appId]: sanitizeIntegrationData(appId, data) }, { merge: true });
  } catch (error) {
    console.error("Entegrasyon kaydedilemedi:", error);
    throw error;
  }
};

// Canlı Dinleme
export const subscribeToIntegrations = (callback) => {
  return onSnapshot(getDocRef(), (doc) => {
    if (doc.exists()) callback(doc.data());
    else callback({});
  });
};
