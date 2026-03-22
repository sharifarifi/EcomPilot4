import { query, orderBy } from 'firebase/firestore';
import {
  FIRESTORE_PATHS,
  collectionRef,
  subscribeToQuery
} from './serviceCore';

const SERVICE_NAME = 'shopifyOrderService';
const SHOPIFY_ORDERS_COLLECTION = FIRESTORE_PATHS.shopifyOrders;

const mapShopifyOrderSnapshot = (document) => {
  const data = document.data();

  return {
    id: document.id,
    ...data,
    source: data.source || 'shopify'
  };
};

export const subscribeToShopifyOrders = (callback) => {
  const shopifyOrdersQuery = query(collectionRef(SHOPIFY_ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
  return subscribeToQuery(SERVICE_NAME, 'subscribeToShopifyOrders', shopifyOrdersQuery, callback, mapShopifyOrderSnapshot);
};
