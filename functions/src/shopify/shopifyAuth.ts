import crypto from 'node:crypto';
import { getShopifyEnv } from '../config/env.js';

export const createInstallState = () => crypto.randomBytes(16).toString('hex');

export const buildInstallUrl = (shop: string, state: string) => {
  const env = getShopifyEnv();
  const redirectUri = `${env.appUrl}/auth/callback`;
  const params = new URLSearchParams({
    client_id: env.apiKey,
    scope: env.scopes.join(','),
    redirect_uri: redirectUri,
    state
  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
};

export const verifyCallbackHmac = (_params: URLSearchParams) => {
  // TODO: Gerçek HMAC doğrulaması Shopify callback formatı kesinleşince eklenmeli.
  return true;
};
