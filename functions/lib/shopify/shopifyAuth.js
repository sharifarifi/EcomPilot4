"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangeAccessToken = exports.verifyCallbackHmac = exports.hashInstallState = exports.buildInstallUrl = exports.buildCallbackUrl = exports.isValidShopDomain = exports.normalizeShopDomain = exports.createInstallState = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const env_js_1 = require("../config/env.js");
const createInstallState = () => node_crypto_1.default.randomBytes(16).toString('hex');
exports.createInstallState = createInstallState;
const normalizeShopDomain = (shop) => (shop
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, ''));
exports.normalizeShopDomain = normalizeShopDomain;
const isValidShopDomain = (shop) => /\.myshopify\.com$/.test((0, exports.normalizeShopDomain)(shop));
exports.isValidShopDomain = isValidShopDomain;
const buildCallbackUrl = () => {
    const env = (0, env_js_1.getShopifyEnv)();
    return `${env.appUrl.replace(/\/$/, '')}/shopifyAuthCallback`;
};
exports.buildCallbackUrl = buildCallbackUrl;
const buildInstallUrl = (shop, state) => {
    const env = (0, env_js_1.getShopifyEnv)();
    const redirectUri = (0, exports.buildCallbackUrl)();
    const params = new URLSearchParams({
        client_id: env.apiKey,
        scope: env.scopes.join(','),
        redirect_uri: redirectUri,
        state
    });
    return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
};
exports.buildInstallUrl = buildInstallUrl;
const hashInstallState = (state) => node_crypto_1.default.createHash('sha256').update(state).digest('hex');
exports.hashInstallState = hashInstallState;
const verifyCallbackHmac = (params) => {
    const { apiSecret } = (0, env_js_1.getShopifyEnv)();
    const providedHmac = params.get('hmac');
    if (!apiSecret || !providedHmac) {
        return false;
    }
    const message = [...params.entries()]
        .filter(([key]) => key !== 'hmac' && key !== 'signature')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
    const digest = node_crypto_1.default.createHmac('sha256', apiSecret).update(message, 'utf8').digest('hex');
    return digest.length === providedHmac.length && node_crypto_1.default.timingSafeEqual(Buffer.from(digest), Buffer.from(providedHmac));
};
exports.verifyCallbackHmac = verifyCallbackHmac;
const exchangeAccessToken = async (shop, code) => {
    const env = (0, env_js_1.getShopifyEnv)();
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: env.apiKey,
            client_secret: env.apiSecret,
            code
        })
    });
    if (!response.ok) {
        throw new Error(`Shopify token exchange failed with status ${response.status}`);
    }
    const payload = await response.json();
    return {
        accessToken: payload.access_token || '',
        scope: payload.scope || payload.associated_user_scope || ''
    };
};
exports.exchangeAccessToken = exchangeAccessToken;
