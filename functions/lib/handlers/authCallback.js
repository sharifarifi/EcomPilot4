"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCallback = void 0;
const axios_1 = __importDefault(require("axios"));
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const env_js_1 = require("../config/env.js");
const shopifyAuth_js_1 = require("../shopify/shopifyAuth.js");
const WEBHOOK_ADDRESS = 'https://shopifywebhookreceiver-bi372exr4a-uc.a.run.app';
const WEBHOOK_TOPICS = ['orders/create', 'orders/updated'];
const ensureOrderWebhooks = async (shop, accessToken) => {
    const headers = { 'X-Shopify-Access-Token': accessToken };
    const baseUrl = `https://${shop}/admin/api/2024-04/webhooks.json`;
    const listResponse = await axios_1.default.get(baseUrl, { headers });
    const existing = Array.isArray(listResponse.data?.webhooks) ? listResponse.data.webhooks : [];
    for (const topic of WEBHOOK_TOPICS) {
        const duplicate = existing.find((w) => w?.topic === topic && w?.address === WEBHOOK_ADDRESS);
        if (duplicate) {
            console.log('Webhook already exists, skipping.', { shop, topic, webhookId: duplicate.id });
            continue;
        }
        await axios_1.default.post(baseUrl, {
            webhook: {
                topic,
                address: WEBHOOK_ADDRESS,
                format: 'json'
            }
        }, { headers });
        console.log('Webhook registered.', { shop, topic, address: WEBHOOK_ADDRESS });
    }
};
const authCallback = async (req, res) => {
    const params = new URLSearchParams(req.query);
    const shop = (0, shopifyAuth_js_1.normalizeShopDomain)(String(req.query.shop || '').trim());
    const code = String(req.query.code || '').trim();
    const state = String(req.query.state || '').trim();
    if (!shop || !code || !state || !(0, shopifyAuth_js_1.isValidShopDomain)(shop)) {
        return res.status(400).json({ error: 'Missing callback parameters.' });
    }
    if (!(0, shopifyAuth_js_1.verifyCallbackHmac)(params)) {
        return res.status(400).json({ error: 'Invalid Shopify signature.' });
    }
    const stateHash = (0, shopifyAuth_js_1.hashInstallState)(state);
    const installSessionRef = firebaseAdmin_js_1.adminDb.collection('shopify_install_sessions').doc(stateHash);
    const installSession = await installSessionRef.get();
    if (!installSession.exists) {
        return res.status(400).json({ error: 'Invalid install state.' });
    }
    try {
        const tokenResponse = await (0, shopifyAuth_js_1.exchangeAccessToken)(shop, code);
        const updatedAt = new Date().toISOString();
        await firebaseAdmin_js_1.adminDb.collection('shopify_stores').doc(shop).set({
            shopDomain: shop,
            accessToken: tokenResponse.accessToken,
            scopes: tokenResponse.scope,
            status: 'active',
            isConnected: true,
            updatedAt
        }, { merge: true });
        await ensureOrderWebhooks(shop, tokenResponse.accessToken);
        await firebaseAdmin_js_1.adminDb.collection('settings').doc('integrations').set({
            shopify: {
                connected: true,
                shopDomain: shop,
                updatedAt
            }
        }, { merge: true });
        await installSessionRef.update({ status: 'succeeded', completedAt: updatedAt });
        const { appBaseUrl } = (0, env_js_1.getBackendEnv)();
        res.redirect(`${appBaseUrl.replace(/\/$/, '')}/?shopify=succeeded&shop=${shop}`);
    }
    catch (error) {
        console.error('❌ Auth callback error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Token exchange failed' });
    }
};
exports.authCallback = authCallback;
