import { FIRESTORE_COLLECTIONS } from './firestorePaths';
import {
  addCollectionDocument,
  deleteCollectionDocument,
  subscribeToCollection,
  updateCollectionDocument,
} from './firestoreService';

const SERVICE_NAME = 'orderService';
const ORDERS_COLLECTION = FIRESTORE_COLLECTIONS.orders;

export const subscribeToOrders = (callback) => (
  subscribeToCollection({
    service: SERVICE_NAME,
    collectionName: ORDERS_COLLECTION,
    callback,
    defaultOrderBy: { field: 'createdAt', direction: 'desc' },
  })
);

export const addOrder = async (orderData) => {

export const subscribeToOrders = (callback) => (
  subscribeToCollection({
    service: SERVICE_NAME,
    collectionName: ORDERS_COLLECTION,
    callback,
    defaultOrderBy: { field: 'createdAt', direction: 'desc' },
  })
);

export const addOrder = async (orderData) => {
import { query, orderBy, serverTimestamp } from 'firebase/firestore';
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

export const subscribeToOrders = (callback) => {
  const ordersQuery = query(collectionRef(ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
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
  await updateDocument(SERVICE_NAME, ORDERS_COLLECTION, orderId, updatedData, 'updateOrder');
};

export const updateOrderStatus = async (orderId, newStatus) => {
  await updateDocument(SERVICE_NAME, ORDERS_COLLECTION, orderId, { status: newStatus }, 'updateOrderStatus');
};

export const deleteOrder = async (orderId) => {
  await deleteDocument(SERVICE_NAME, ORDERS_COLLECTION, orderId, 'deleteOrder');
import { FIRESTORE_COLLECTIONS } from './firestorePaths';
import {
  addCollectionDocument,
  deleteCollectionDocument,
  subscribeToCollection,
  updateCollectionDocument,
} from './firestoreService';

const SERVICE_NAME = 'orderService';
const ORDERS_COLLECTION = FIRESTORE_COLLECTIONS.orders;

export const subscribeToOrders = (callback) => (
  subscribeToCollection({
    service: SERVICE_NAME,
    collectionName: ORDERS_COLLECTION,
    callback,
    defaultOrderBy: { field: 'createdAt', direction: 'desc' },
  })
);

export const addOrder = async (orderData) => {
  await addCollectionDocument(SERVICE_NAME, ORDERS_COLLECTION, {
    ...orderData,
    status: 'Onaylandı',
  });
};

export const updateOrder = async (orderId, updatedData) => {
  await updateCollectionDocument(SERVICE_NAME, ORDERS_COLLECTION, orderId, updatedData);
};

export const updateOrderStatus = async (orderId, newStatus) => {
  await updateCollectionDocument(SERVICE_NAME, ORDERS_COLLECTION, orderId, { status: newStatus });
};

export const deleteOrder = async (orderId) => {
  await deleteCollectionDocument(SERVICE_NAME, ORDERS_COLLECTION, orderId);
};
