import { onRequest } from 'firebase-functions/v2/https';
import { authCallback } from './handlers/authCallback.js';
import { connectionTest } from './handlers/connectionTest.js';
import { manualSync } from './handlers/manualSync.js';
import { startInstall } from './handlers/startInstall.js';
import { webhookReceiver } from './handlers/webhookReceiver.js';

/**
 * TypeScript Hatalarını Gidermek İçin Sarıcı (Wrapper) Yapısı:
 * onRequest içindeki fonksiyonların dönüş tipi void | Promise<void> olmalıdır.
 * Handler fonksiyonlarını async/await ile çağırarak bu uyumluluğu sağlıyoruz.
 */

export const shopifyStartInstall = onRequest({ 
    cors: true 
}, async (req, res) => {
    await startInstall(req, res);
});

export const shopifyAuthCallback = onRequest(async (req, res) => {
    await authCallback(req, res);
});

export const shopifyWebhookReceiver = onRequest({ 
    cors: false 
}, async (req, res) => {
    await webhookReceiver(req, res);
});

export const shopifyManualSync = onRequest(async (req, res) => {
    await manualSync(req, res);
});

export const shopifyConnectionTest = onRequest({ 
    cors: true 
}, async (req, res) => {
    await connectionTest(req, res);
});