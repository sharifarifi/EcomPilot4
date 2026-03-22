import { db } from './firebaseConfig';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export const FIRESTORE_PATHS = {
  orders: 'orders',
  dailyReports: 'daily_reports',
  tasks: 'tasks',
  notifications: 'notifications'
};

const formatLogPrefix = (service, action) => `[firebase:${service}] ${action}`;

export const logServiceEvent = (service, action, details) => {
  if (details === undefined) {
    console.info(formatLogPrefix(service, action));
    return;
  }

  console.info(formatLogPrefix(service, action), details);
};

export const logServiceError = (service, action, error, details) => {
  if (details === undefined) {
    console.error(formatLogPrefix(service, action), error);
    return;
  }

  console.error(formatLogPrefix(service, action), details, error);
};

const ensureDb = () => {
  if (!db) {
    throw new Error('Firebase Firestore henüz yapılandırılmadı.');
  }

  return db;
};

export const collectionRef = (path) => collection(ensureDb(), path);
export const docRef = (path, id) => doc(ensureDb(), path, id);

export const mapSnapshotDocs = (snapshot, mapDoc = (document) => ({ id: document.id, ...document.data() })) => (
  snapshot.docs.map(mapDoc)
);

export const subscribeToQuery = (service, action, queryRef, callback, mapDoc) => {
  return onSnapshot(
    queryRef,
    (snapshot) => callback(mapSnapshotDocs(snapshot, mapDoc)),
    (error) => logServiceError(service, action, error)
  );
};

export const createDocument = async (service, path, payload, action = 'create') => {
  try {
    return await addDoc(collectionRef(path), payload);
  } catch (error) {
    logServiceError(service, action, error, { path, payload });
    throw error;
  }
};

export const updateDocument = async (service, path, id, payload, action = 'update') => {
  try {
    await updateDoc(docRef(path, id), payload);
  } catch (error) {
    logServiceError(service, action, error, { path, id, payload });
    throw error;
  }
};

export const deleteDocument = async (service, path, id, action = 'delete') => {
  try {
    await deleteDoc(docRef(path, id));
  } catch (error) {
    logServiceError(service, action, error, { path, id });
    throw error;
  }
};
