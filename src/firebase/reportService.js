import { getDoc, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import {
  FIRESTORE_PATHS,
  collectionRef,
  createDocument,
  deleteDocument,
  docRef,
  subscribeToQuery,
  updateDocument
} from './serviceCore';
import { normalizeReportStatus } from '../utils/reportEditUtils';

const SERVICE_NAME = 'reportService';
const REPORTS_COLLECTION = FIRESTORE_PATHS.dailyReports;

const deriveReportStatusFromTasks = (tasks) => {
  if (!Array.isArray(tasks) || !tasks.length) return null;
  const allCompleted = tasks.every((task) => normalizeReportStatus(task?.status) === 'completed');
  return allCompleted ? 'Tamamlandı' : 'Devam Ediyor';
};

const mapReportSnapshot = (document) => {
  const data = document.data();

  return {
    id: document.id,
    ...data,
    createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : null
  }; 
};

export const subscribeToReports = (callback, options = {}) => {
  const { uid, isManagement = false } = options;
  if (!isManagement && !uid) {
    callback([]);
    return () => {};
  }

  const reportsQuery = isManagement
    ? query(collectionRef(REPORTS_COLLECTION), orderBy('date', 'desc'))
    : query(
        collectionRef(REPORTS_COLLECTION),
        where('userId', '==', uid),
        orderBy('date', 'desc')
      );

  return subscribeToQuery(SERVICE_NAME, 'subscribeToReports', reportsQuery, callback, mapReportSnapshot);
};

export const addReport = async (reportData) => {
  const statusFromTasks = deriveReportStatusFromTasks(reportData?.tasks);
  const payload = {
    ...reportData,
    ...(statusFromTasks ? { status: statusFromTasks } : {}),
    createdAt: serverTimestamp()
  };

  if (normalizeReportStatus(payload.status) === 'completed') {
    payload.completedAt = serverTimestamp();
  }

  await createDocument(
    SERVICE_NAME,
    REPORTS_COLLECTION,
    payload,
    'addReport'
  );
};

export const updateReport = async (reportId, updatedData) => {
  const reportRef = docRef(REPORTS_COLLECTION, reportId);
  const existingSnapshot = await getDoc(reportRef);
  const existingData = existingSnapshot.exists() ? existingSnapshot.data() : {};

  const statusFromTasks = deriveReportStatusFromTasks(updatedData?.tasks);
  const nextStatus = statusFromTasks || updatedData?.status || existingData?.status;
  const normalizedNextStatus = normalizeReportStatus(nextStatus);
  const normalizedPreviousStatus = normalizeReportStatus(existingData?.status);

  const payload = {
    ...updatedData,
    ...(statusFromTasks ? { status: statusFromTasks } : {})
  };

  if (normalizedNextStatus === 'completed' && !existingData?.completedAt) {
    payload.completedAt = serverTimestamp();
  }

  // TODO: Ürün kararı netleştiğinde completed durumundan tekrar devam ediyor'a geçişte completedAt temizlenebilir.
  if (normalizedPreviousStatus === 'completed' && normalizedNextStatus !== 'completed') {
    payload.completedAt = existingData?.completedAt || payload.completedAt;
  }

  await updateDocument(SERVICE_NAME, REPORTS_COLLECTION, reportId, payload, 'updateReport');
};

export const deleteReport = async (reportId) => {
  await deleteDocument(SERVICE_NAME, REPORTS_COLLECTION, reportId, 'deleteReport');
};
