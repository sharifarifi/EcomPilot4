export type ShopifyEnv = {
  appUrl: string;
  apiKey: string;
  apiSecret: string;
  scopes: string[];
  webhookSecret: string;
};

const readEnv = (key: string, fallback = '') => process.env[key]?.trim() || fallback;

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
