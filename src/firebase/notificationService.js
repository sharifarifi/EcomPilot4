import { query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import {
  FIRESTORE_PATHS,
  collectionRef,
  createDocument,
  logServiceError,
  subscribeToQuery,
  updateDocument
} from './serviceCore';

const SERVICE_NAME = 'notificationService';
const NOTIFICATIONS_COLLECTION = FIRESTORE_PATHS.notifications;

export const sendNotification = async (recipientId, message, type = 'info') => {
  try {
    await createDocument(
      SERVICE_NAME,
      NOTIFICATIONS_COLLECTION,
      {
        recipientId,
        message,
        type,
        isRead: false,
        createdAt: serverTimestamp()
      },
      'sendNotification'
    );
    return true;
  } catch (error) {
    logServiceError(SERVICE_NAME, 'sendNotification:nonBlocking', error, { recipientId, type });
    return false;
  }
};

export const subscribeToNotifications = (userId, callback) => {
  const notificationsQuery = query(
    collectionRef(NOTIFICATIONS_COLLECTION),
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return subscribeToQuery(SERVICE_NAME, 'subscribeToNotifications', notificationsQuery, callback);
};

export const markNotificationAsRead = async (notifId) => {
  try {
    await updateDocument(SERVICE_NAME, NOTIFICATIONS_COLLECTION, notifId, { isRead: true }, 'markNotificationAsRead');
    return true;
  } catch (error) {
    logServiceError(SERVICE_NAME, 'markNotificationAsRead:nonBlocking', error, { notifId });
    return false;
  }
};
