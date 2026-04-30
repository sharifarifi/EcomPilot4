"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopifyConnectionTest = exports.shopifyManualSync = exports.shopifyWebhookReceiver = exports.shopifyAuthCallback = exports.shopifyStartInstall = void 0;
const https_1 = require("firebase-functions/v2/https");
const authCallback_js_1 = require("./handlers/authCallback.js");
const connectionTest_js_1 = require("./handlers/connectionTest.js");
const manualSync_js_1 = require("./handlers/manualSync.js");
const startInstall_js_1 = require("./handlers/startInstall.js");
const webhookReceiver_js_1 = require("./handlers/webhookReceiver.js");
/**
 * TypeScript Hatalarını Gidermek İçin Sarıcı (Wrapper) Yapısı:
 * onRequest içindeki fonksiyonların dönüş tipi void | Promise<void> olmalıdır.
 * Handler fonksiyonlarını async/await ile çağırarak bu uyumluluğu sağlıyoruz.
 */
exports.shopifyStartInstall = (0, https_1.onRequest)({
    cors: true
}, async (req, res) => {
    await (0, startInstall_js_1.startInstall)(req, res);
});
exports.shopifyAuthCallback = (0, https_1.onRequest)(async (req, res) => {
    await (0, authCallback_js_1.authCallback)(req, res);
});
exports.shopifyWebhookReceiver = (0, https_1.onRequest)({
    cors: false
}, async (req, res) => {
    await (0, webhookReceiver_js_1.webhookReceiver)(req, res);
});
exports.shopifyManualSync = (0, https_1.onRequest)(async (req, res) => {
    await (0, manualSync_js_1.manualSync)(req, res);
});
exports.shopifyConnectionTest = (0, https_1.onRequest)({
    cors: true
}, async (req, res) => {
    await (0, connectionTest_js_1.connectionTest)(req, res);
});
