import { db } from './firebaseConfig';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

const LOG_PREFIX = '[firebase-service]';

export const logServiceEvent = (level, service, action, details) => {
  const logger = console[level] || console.log;
  logger(`${LOG_PREFIX} ${service}.${action}`, details);
};

export const normalizeSnapshotDocs = (snapshot, mapDocument = (data) => data) => (
  snapshot.docs.map((snapshotDoc) => mapDocument({ id: snapshotDoc.id, ...snapshotDoc.data() }, snapshotDoc))
);

export const buildCollectionQuery = (collectionName, constraints = [], defaultOrderBy) => {
  const collectionRef = collection(db, collectionName);
  const queryConstraints = [...constraints];

  if (defaultOrderBy) {
    queryConstraints.push(orderBy(defaultOrderBy.field, defaultOrderBy.direction || 'asc'));
  }

  return query(collectionRef, ...queryConstraints);
};

export const subscribeToCollection = ({
  service,
  collectionName,
  callback,
  constraints = [],
  defaultOrderBy,
  mapDocument,
}) => {
  const collectionQuery = buildCollectionQuery(collectionName, constraints, defaultOrderBy);

  return onSnapshot(
    collectionQuery,
    (snapshot) => {
      callback(normalizeSnapshotDocs(snapshot, mapDocument));
    },
    (error) => {
      logServiceEvent('error', service, 'subscribe', error);
    }
  );
};

export const addCollectionDocument = async (service, collectionName, data, options = {}) => {
  const payload = options.includeCreatedAt === false
    ? data
    : { ...data, createdAt: serverTimestamp() };

  try {
    return await addDoc(collection(db, collectionName), payload);
  } catch (error) {
    logServiceEvent('error', service, 'add', error);
    throw error;
  }
};

export const updateCollectionDocument = async (service, collectionName, documentId, data) => {
  try {
    await updateDoc(doc(db, collectionName, documentId), data);
  } catch (error) {
    logServiceEvent('error', service, 'update', error);
    throw error;
  }
};

export const deleteCollectionDocument = async (service, collectionName, documentId) => {
  try {
    await deleteDoc(doc(db, collectionName, documentId));
  } catch (error) {
    logServiceEvent('error', service, 'delete', error);
    throw error;
  }
};
