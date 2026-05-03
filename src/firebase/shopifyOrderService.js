import { onSnapshot, query, where, limit } from 'firebase/firestore';
import {
  FIRESTORE_PATHS,
  collectionRef,
  mapSnapshotDocs,
  logServiceError
} from './serviceCore';
import { normalizeShopDomain } from '../config/shopify';

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
  const customerData = typeof data.customer === 'object' && data.customer !== null ? data.customer : {};
  const customerFirstName = customerData.firstName || customerData.first_name || '';
  const customerLastName = customerData.lastName || customerData.last_name || '';
  const customerEmail = customerData.email || data.email || data.customer_email || '';

  return {
    id: document.id,
    ...data,
    shopDomain: data.shopDomain || SHOP_DOMAIN,
    shopifyOrderId: data.shopifyOrderId || data.shopify_order_id || String(data.order_id || ''),
    orderName: data.orderName || data.order_number || data.name || '',
    totalPrice: data.totalPrice ?? data.total_price ?? 0,
    currency: data.currency || data.currencyCode || 'TRY',
    financialStatus: data.financialStatus || data.financial_status || '',
    fulfillmentStatus: data.fulfillmentStatus || data.fulfillment_status || '',
    createdAtShopify: data.createdAtShopify || data.created_at || data.createdAt || null,
    createdAt: toIsoDate(data.createdAt) || data.created_at || null,
    updatedAt: toIsoDate(data.updatedAt) || data.updatedAt || null,
    storeId: data.storeId || data.shopDomain || data.storeDomain || data.domain || data.shop || SHOP_DOMAIN,
    customer: {
      firstName: customerFirstName,
      lastName: customerLastName,
      email: customerEmail,
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

const resolveDomainFromOrder = (order) => (
  normalizeShopDomain(
    order.shopDomain || order.storeId || order.shop || order.domain || order.storeDomain || ''
  )
);

export const subscribeToShopifyOrders = (callback, onError) => {
  const expectedDomain = normalizeShopDomain(SHOP_DOMAIN);
  const shopifyOrdersQuery = query(
    collectionRef(SHOPIFY_ORDERS_COLLECTION),
    where('shopDomain', '==', expectedDomain)
  );

  const fallbackQuery = query(
    collectionRef(SHOPIFY_ORDERS_COLLECTION),
    limit(100)
  );

  let fallbackUnsubscribe = null;

  const primaryUnsubscribe = onSnapshot(
    shopifyOrdersQuery,
    (snapshot) => {
      const mapped = mapSnapshotDocs(snapshot, mapShopifyOrderSnapshot);
      console.info('[shopifyOrderService] Shopify orders primary query size:', mapped.length);

      if (mapped.length > 0) {
        if (fallbackUnsubscribe) {
          fallbackUnsubscribe();
          fallbackUnsubscribe = null;
        }
        callback(sortOrders(mapped));
        return;
      }

      if (!fallbackUnsubscribe) {
        fallbackUnsubscribe = onSnapshot(
          fallbackQuery,
          (fallbackSnapshot) => {
            const fallbackMapped = mapSnapshotDocs(fallbackSnapshot, mapShopifyOrderSnapshot);
            console.info('[shopifyOrderService] Shopify orders fallback query size:', fallbackMapped.length);
            console.table(
              fallbackMapped.slice(0, 20).map((order) => ({
                id: order.id,
                shopDomain: order.shopDomain || '',
                storeId: order.storeId || '',
                shop: order.shop || '',
                domain: order.domain || '',
                storeDomain: order.storeDomain || '',
                resolvedDomain: resolveDomainFromOrder(order),
              }))
            );

            const filtered = fallbackMapped.filter((order) => resolveDomainFromOrder(order) === expectedDomain);
            callback(sortOrders(filtered));
          },
          (error) => {
            logServiceError(SERVICE_NAME, 'subscribeToShopifyOrders:fallback', error);
            if (typeof onError === 'function') onError(error);
          }
        );
      }
    },
    (error) => {
      logServiceError(SERVICE_NAME, 'subscribeToShopifyOrders:primary', error);
      if (typeof onError === 'function') onError(error);
    }
  );

  return () => {
    primaryUnsubscribe();
    if (fallbackUnsubscribe) fallbackUnsubscribe();
  };
};
