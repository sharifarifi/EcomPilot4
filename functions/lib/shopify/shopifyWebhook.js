"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWebhookDispatchPayload = exports.getWebhookRoute = exports.getWebhookContext = exports.verifyWebhookSignature = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const env_js_1 = require("../config/env.js");
const verifyWebhookSignature = (rawBody, signature = '') => {
    const { webhookSecret } = (0, env_js_1.getShopifyEnv)();
    if (!webhookSecret) {
        return false;
    }
    const digest = node_crypto_1.default.createHmac('sha256', webhookSecret).update(rawBody, 'utf8').digest('base64');
    if (digest.length !== signature.length) {
        return false;
    }
    return node_crypto_1.default.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
};
exports.verifyWebhookSignature = verifyWebhookSignature;
const getWebhookContext = (headers) => ({
    topic: String(headers.topic || '').trim().toLowerCase(),
    shopDomain: String(headers.shopDomain || '').trim().toLowerCase(),
    webhookId: String(headers.webhookId || '').trim()
});
exports.getWebhookContext = getWebhookContext;
const getWebhookRoute = (topic) => {
    if (topic === 'orders/create' || topic === 'orders/updated') {
        return topic;
    }
    return null;
};
exports.getWebhookRoute = getWebhookRoute;
const buildWebhookDispatchPayload = (context) => {
    const route = (0, exports.getWebhookRoute)(context.topic);
    if (!route) {
        return {
            supported: false,
            resource: 'unknown',
            action: 'ignored'
        };
    }
    return {
        supported: true,
        resource: 'orders',
        action: route.split('/')[1],
        route
    };
};
exports.buildWebhookDispatchPayload = buildWebhookDispatchPayload;
