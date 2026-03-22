import { getDoc, onSnapshot } from 'firebase/firestore';
import { FIRESTORE_PATHS, docRef } from './serviceCore';

const SERVICE_NAME = 'shopifyStoreService';
const SHOPIFY_STORES_COLLECTION = FIRESTORE_PATHS.shopifyStores;

const mapShopifyStoreSnapshot = (snapshot) => {
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
};

export const getShopifyStore = async (storeId) => {
  if (!storeId) {
    return null;
  }

  const snapshot = await getDoc(docRef(SHOPIFY_STORES_COLLECTION, storeId));
  return mapShopifyStoreSnapshot(snapshot);
};

export const subscribeToShopifyStore = (storeId, callback) => {
  if (!storeId) {
    callback(null);
    return () => {};
  }

  return onSnapshot(
    docRef(SHOPIFY_STORES_COLLECTION, storeId),
    (snapshot) => callback(mapShopifyStoreSnapshot(snapshot)),
    (error) => console.error(`[firebase:${SERVICE_NAME}] subscribeToShopifyStore`, { storeId }, error)
  );
};
