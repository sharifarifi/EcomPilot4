import { where } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from './firestorePaths';
import {
  addCollectionDocument,
  subscribeToCollection,
  updateCollectionDocument,
} from './firestoreService';

const SERVICE_NAME = 'notificationService';
const NOTIFICATIONS_COLLECTION = FIRESTORE_COLLECTIONS.notifications;

export const sendNotification = async (recipientId, message, type = 'info') => {
  await addCollectionDocument(SERVICE_NAME, NOTIFICATIONS_COLLECTION, {
    recipientId,
    message,
    type,
    isRead: false,
  });
};

export const subscribeToNotifications = (userId, callback) => (
  subscribeToCollection({
    service: SERVICE_NAME,
    collectionName: NOTIFICATIONS_COLLECTION,
    callback,
    constraints: [where('recipientId', '==', userId)],
    defaultOrderBy: { field: 'createdAt', direction: 'desc' },
  })
);

export const markNotificationAsRead = async (notifId) => {
  await updateCollectionDocument(SERVICE_NAME, NOTIFICATIONS_COLLECTION, notifId, { isRead: true });
};
