"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShopifyEnv = exports.assertBackendEnv = exports.hasShopifyEnv = exports.getMissingBackendEnvKeys = exports.getBackendEnv = void 0;
const readEnv = (key, fallback = '') => process.env[key]?.trim() || fallback;
const requiredEnvKeys = [
    'SHOPIFY_API_KEY',
    'SHOPIFY_API_SECRET',
    'SHOPIFY_APP_SCOPES',
    'SHOPIFY_APP_URL',
    'FIREBASE_PROJECT_ID',
    'APP_BASE_URL'
];
const getBackendEnv = () => ({
    appBaseUrl: readEnv('APP_BASE_URL'),
    firebaseProjectId: readEnv('FIREBASE_PROJECT_ID'),
    appUrl: readEnv('SHOPIFY_APP_URL'),
    apiKey: readEnv('SHOPIFY_API_KEY'),
    apiSecret: readEnv('SHOPIFY_API_SECRET'),
    scopes: readEnv('SHOPIFY_APP_SCOPES').split(',').map((scope) => scope.trim()).filter(Boolean),
    webhookSecret: readEnv('SHOPIFY_WEBHOOK_SECRET')
});
exports.getBackendEnv = getBackendEnv;
const getMissingBackendEnvKeys = () => {
    const env = (0, exports.getBackendEnv)();
    return requiredEnvKeys.filter((key) => {
        switch (key) {
            case 'SHOPIFY_API_KEY':
                return !env.apiKey;
            case 'SHOPIFY_API_SECRET':
                return !env.apiSecret;
            case 'SHOPIFY_APP_SCOPES':
                return env.scopes.length === 0;
            case 'SHOPIFY_APP_URL':
                return !env.appUrl;
            case 'FIREBASE_PROJECT_ID':
                return !env.firebaseProjectId;
            case 'APP_BASE_URL':
                return !env.appBaseUrl;
            default:
                return true;
        }
    });
};
exports.getMissingBackendEnvKeys = getMissingBackendEnvKeys;
const hasShopifyEnv = () => {
    return (0, exports.getMissingBackendEnvKeys)().length === 0;
};
exports.hasShopifyEnv = hasShopifyEnv;
const assertBackendEnv = () => {
    const missingKeys = (0, exports.getMissingBackendEnvKeys)();
    if (missingKeys.length > 0) {
        throw new Error(`Missing required backend environment variables: ${missingKeys.join(', ')}`);
    }
    return (0, exports.getBackendEnv)();
};
exports.assertBackendEnv = assertBackendEnv;
const getShopifyEnv = () => (0, exports.getBackendEnv)();
exports.getShopifyEnv = getShopifyEnv;
