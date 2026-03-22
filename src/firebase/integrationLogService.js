import { orderBy, query } from 'firebase/firestore';
import { FIRESTORE_PATHS, collectionRef, subscribeToQuery } from './serviceCore';

const SERVICE_NAME = 'integrationLogService';
const INTEGRATION_LOGS_COLLECTION = FIRESTORE_PATHS.integrationLogs;

const mapIntegrationLogSnapshot = (document) => {
  const data = document.data();

  return {
    id: document.id,
    ...data,
    receivedAt: data.receivedAt || null,
    createdAt: data.createdAt || null
  };
};

export const subscribeToIntegrationLogs = (callback, options = {}) => {
  const logsQuery = query(collectionRef(INTEGRATION_LOGS_COLLECTION), orderBy('receivedAt', 'desc'));

  return subscribeToQuery(
    SERVICE_NAME,
    'subscribeToIntegrationLogs',
    logsQuery,
    (logs) => {
      const filteredLogs = logs.filter((log) => {
        if (options.source && log.source !== options.source) return false;
        if (options.shopDomain && log.shopDomain !== options.shopDomain) return false;
        return true;
      });

      callback(typeof options.limit === 'number' ? filteredLogs.slice(0, options.limit) : filteredLogs);
    },
    mapIntegrationLogSnapshot
  );
};
