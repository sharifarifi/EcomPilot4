import { query, orderBy, serverTimestamp } from 'firebase/firestore';
import {
  FIRESTORE_PATHS,
  collectionRef,
  createDocument,
  deleteDocument,
  subscribeToQuery,
  updateDocument
} from './serviceCore';

const SERVICE_NAME = 'reportService';
const REPORTS_COLLECTION = FIRESTORE_PATHS.dailyReports;

const mapReportSnapshot = (document) => {
  const data = document.data();

  return {
    id: document.id,
    ...data,
    createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : null
  }; 
};

export const subscribeToReports = (callback) => {
  const reportsQuery = query(collectionRef(REPORTS_COLLECTION), orderBy('date', 'desc'));
  return subscribeToQuery(SERVICE_NAME, 'subscribeToReports', reportsQuery, callback, mapReportSnapshot);
};

export const addReport = async (reportData) => {
  await createDocument(
    SERVICE_NAME,
    REPORTS_COLLECTION,
    {
      ...reportData,
      createdAt: serverTimestamp()
    },
    'addReport'
  );
};

export const updateReport = async (reportId, updatedData) => {
  await updateDocument(SERVICE_NAME, REPORTS_COLLECTION, reportId, updatedData, 'updateReport');
};

export const deleteReport = async (reportId) => {
  await deleteDocument(SERVICE_NAME, REPORTS_COLLECTION, reportId, 'deleteReport');
};
