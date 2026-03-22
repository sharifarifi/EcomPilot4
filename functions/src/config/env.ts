export type BackendEnv = {
  appBaseUrl: string;
  firebaseProjectId: string;
export type ShopifyEnv = {
  appUrl: string;
  apiKey: string;
  apiSecret: string;
  scopes: string[];
  webhookSecret: string;
};

const readEnv = (key: string, fallback = '') => process.env[key]?.trim() || fallback;

const requiredEnvKeys = [
  'SHOPIFY_API_KEY',
  'SHOPIFY_API_SECRET',
  'SHOPIFY_APP_SCOPES',
  'SHOPIFY_APP_URL',
  'FIREBASE_PROJECT_ID',
  'APP_BASE_URL'
] as const;

export const getBackendEnv = (): BackendEnv => ({
  appBaseUrl: readEnv('APP_BASE_URL'),
  firebaseProjectId: readEnv('FIREBASE_PROJECT_ID'),
  appUrl: readEnv('SHOPIFY_APP_URL'),
  apiKey: readEnv('SHOPIFY_API_KEY'),
  apiSecret: readEnv('SHOPIFY_API_SECRET'),
  scopes: readEnv('SHOPIFY_APP_SCOPES').split(',').map((scope) => scope.trim()).filter(Boolean),
  webhookSecret: readEnv('SHOPIFY_WEBHOOK_SECRET')
});

export const getMissingBackendEnvKeys = () => {
  const env = getBackendEnv();

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

export const hasShopifyEnv = () => {
  return getMissingBackendEnvKeys().length === 0;
};

export const assertBackendEnv = () => {
  const missingKeys = getMissingBackendEnvKeys();

  if (missingKeys.length > 0) {
    throw new Error(`Missing required backend environment variables: ${missingKeys.join(', ')}`);
  }

  return getBackendEnv();
};

export const getShopifyEnv = () => getBackendEnv();
export const getShopifyEnv = (): ShopifyEnv => ({
  appUrl: readEnv('SHOPIFY_APP_URL'),
  apiKey: readEnv('SHOPIFY_API_KEY'),
  apiSecret: readEnv('SHOPIFY_API_SECRET'),
  scopes: readEnv('SHOPIFY_SCOPES').split(',').map((scope) => scope.trim()).filter(Boolean),
  webhookSecret: readEnv('SHOPIFY_WEBHOOK_SECRET')
});

export const hasShopifyEnv = () => {
  const env = getShopifyEnv();
  return Boolean(env.appUrl && env.apiKey && env.apiSecret);
};
