import { onRequest } from 'firebase-functions/v2/https';
import { authCallback } from './handlers/authCallback.js';
import { connectionTest } from './handlers/connectionTest.js';
import { manualSync } from './handlers/manualSync.js';
import { startInstall } from './handlers/startInstall.js';
import { webhookReceiver } from './handlers/webhookReceiver.js';

export const shopifyStartInstall = onRequest(startInstall);
export const shopifyAuthCallback = onRequest(authCallback);
export const shopifyWebhookReceiver = onRequest({ cors: false }, webhookReceiver);
export const shopifyManualSync = onRequest(manualSync);
export const shopifyConnectionTest = onRequest({ cors: true }, connectionTest);
