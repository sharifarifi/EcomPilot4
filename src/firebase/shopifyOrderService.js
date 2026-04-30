import { query, where } from 'firebase/firestore';
import {
  FIRESTORE_PATHS,
  collectionRef,
  subscribeToQuery
} from './serviceCore';

const SERVICE_NAME = 'shopifyOrderService';
const SHOPIFY_ORDERS_COLLECTION = FIRESTORE_PATHS.shopifyOrders;
const SHOP_DOMAIN = 'z50nyc-dm.myshopify.com';

const toIsoDate = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
};

const mapShopifyOrderSnapshot = (document) => {
  const data = document.data();

  return {
    id: document.id,
    ...data,
    shopDomain: data.shopDomain || SHOP_DOMAIN,
    shopifyOrderId: data.shopifyOrderId || String(data.order_id || ''),
    orderName: data.orderName || data.order_number || '',
    totalPrice: data.totalPrice ?? data.total_price ?? 0,
    financialStatus: data.financialStatus || data.financial_status || '',
    fulfillmentStatus: data.fulfillmentStatus || data.fulfillment_status || '',
    createdAtShopify: data.createdAtShopify || data.created_at || null,
    createdAt: toIsoDate(data.createdAt) || data.created_at || null,
    updatedAt: toIsoDate(data.updatedAt) || data.updatedAt || null,
    storeId: data.storeId || data.shopDomain || SHOP_DOMAIN,
    customer: data.customer || {
      firstName: '',
      lastName: '',
      email: data.customer_email || '',
    },
    source: data.source || 'shopify'
  };
};

const normalizeTimestamp = (value) => {
  if (!value) return 0;
  const parsed = new Date(toIsoDate(value) || value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const sortOrders = (orders = []) => (
  [...orders].sort((a, b) => {
    const left = normalizeTimestamp(a.createdAtShopify || a.createdAt);
    const right = normalizeTimestamp(b.createdAtShopify || b.createdAt);
    return right - left;
  })
);

export const subscribeToShopifyOrders = (callback, onError) => {
  const shopifyOrdersQuery = query(
    collectionRef(SHOPIFY_ORDERS_COLLECTION),
    where('shopDomain', '==', SHOP_DOMAIN)
  );
  return subscribeToQuery(
    SERVICE_NAME,
    'subscribeToShopifyOrders',
    shopifyOrdersQuery,
    (items) => callback(sortOrders(items)),
    mapShopifyOrderSnapshot,
    onError
  );
};
