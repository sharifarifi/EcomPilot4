import { arrayUnion } from 'firebase/firestore';
import { sendNotification } from './notificationService';
import { FIRESTORE_COLLECTIONS } from './firestorePaths';
import {
  addCollectionDocument,
  subscribeToCollection,
  updateCollectionDocument,
  deleteCollectionDocument,
} from './firestoreService';

const SERVICE_NAME = 'taskService';
const TASKS_COLLECTION = FIRESTORE_COLLECTIONS.tasks;

const createTaskLogEntry = (text, user = 'Sistem') => ({
  id: Date.now(),
  user,
  text,
  type: 'log',
  time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
});

export const subscribeToTasks = (callback) => (
  subscribeToCollection({
    service: SERVICE_NAME,
    collectionName: TASKS_COLLECTION,
    callback,
    defaultOrderBy: { field: 'createdAt', direction: 'desc' },
  })
);

export const addTask = async (taskData) => {
  await addCollectionDocument(SERVICE_NAME, TASKS_COLLECTION, {
    ...taskData,
    status: 'Bekliyor',
    comments: [createTaskLogEntry('İş emri oluşturuldu.')],
  });

  if (taskData.assignee) {
    await sendNotification(
      taskData.assignee,
      `Yeni bir görev atandı: "${taskData.title}"`,
      'task'
    );
  }
};

export const updateTaskStatus = async (taskId, newStatus, userName) => {
  await updateCollectionDocument(SERVICE_NAME, TASKS_COLLECTION, taskId, {
    status: newStatus,
    comments: arrayUnion(createTaskLogEntry(`${userName} durumu değiştirdi: ${newStatus}`)),
  });
};

export const addTaskComment = async (taskId, comment) => {
  await updateCollectionDocument(SERVICE_NAME, TASKS_COLLECTION, taskId, {
    comments: arrayUnion(comment),
  });
};

export const deleteTask = async (taskId) => {
  await deleteCollectionDocument(SERVICE_NAME, TASKS_COLLECTION, taskId);
};
