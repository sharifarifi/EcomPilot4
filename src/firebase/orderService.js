import { query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import {
  FIRESTORE_PATHS,
  collectionRef,
  createDocument,
  deleteDocument,
  subscribeToQuery,
  updateDocument
} from './serviceCore';

const SERVICE_NAME = 'orderService';
const ORDERS_COLLECTION = FIRESTORE_PATHS.orders;
const ORDER_EDITABLE_FIELDS = [
  'customer',
  'phone',
  'city',
  'district',
  'fullAddress',
  'payment',
  'items',
  'total',
  'taker',
  'date',
  'userId',
  'status',
  'shippingStatus',
  'note'
];

export const subscribeToOrders = (callback, options = {}) => {
  const { uid, isManagement = false } = options;
  if (!isManagement && !uid) {
    callback([]);
    return () => {};
  }

  const ordersQuery = isManagement
    ? query(collectionRef(ORDERS_COLLECTION), orderBy('createdAt', 'desc'))
    : query(
        collectionRef(ORDERS_COLLECTION),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      );

  return subscribeToQuery(SERVICE_NAME, 'subscribeToOrders', ordersQuery, callback);
};

export const addOrder = async (orderData) => {
  await createDocument(
    SERVICE_NAME,
    ORDERS_COLLECTION,
    {
      ...orderData,
      status: 'Onaylandı',
      createdAt: serverTimestamp()
    },
    'addOrder'
  );
};

export const updateOrder = async (orderId, updatedData) => {
  const payload = Object.fromEntries(
    Object.entries(updatedData || {}).filter(([key, value]) => (
      ORDER_EDITABLE_FIELDS.includes(key) && value !== undefined
    ))
  );

  await updateDocument(SERVICE_NAME, ORDERS_COLLECTION, orderId, payload, 'updateOrder');
};

export const updateOrderStatus = async (orderId, newStatus) => {
  await updateDocument(SERVICE_NAME, ORDERS_COLLECTION, orderId, { status: newStatus }, 'updateOrderStatus');
};

export const deleteOrder = async (orderId) => {
  await deleteDocument(SERVICE_NAME, ORDERS_COLLECTION, orderId, 'deleteOrder');
};
