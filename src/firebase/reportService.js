import { FIRESTORE_COLLECTIONS } from './firestorePaths';
import {
  addCollectionDocument,
  deleteCollectionDocument,
  subscribeToCollection,
  updateCollectionDocument,
} from './firestoreService';

const SERVICE_NAME = 'reportService';
const REPORTS_COLLECTION = FIRESTORE_COLLECTIONS.reports;

const mapReportDocument = (report) => ({
  ...report,
  createdAt: report.createdAt?.toMillis ? report.createdAt.toMillis() : null,
});

export const subscribeToReports = (callback) => (
  subscribeToCollection({
    service: SERVICE_NAME,
    collectionName: REPORTS_COLLECTION,
    callback,
    defaultOrderBy: { field: 'date', direction: 'desc' },
    mapDocument: mapReportDocument,
  })
);

export const addReport = async (reportData) => {
  await addCollectionDocument(SERVICE_NAME, REPORTS_COLLECTION, reportData);
};

export const updateReport = async (reportId, updatedData) => {
  await updateCollectionDocument(SERVICE_NAME, REPORTS_COLLECTION, reportId, updatedData);
};

export const deleteReport = async (reportId) => {
  await deleteCollectionDocument(SERVICE_NAME, REPORTS_COLLECTION, reportId);
};
