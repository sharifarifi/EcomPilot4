import crypto from 'node:crypto';
import { getShopifyEnv } from '../config/env.js';

export const createInstallState = () => crypto.randomBytes(16).toString('hex');

export const normalizeShopDomain = (shop: string) => (
  shop
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
);

export const isValidShopDomain = (shop: string) => /\.myshopify\.com$/.test(normalizeShopDomain(shop));

export const buildCallbackUrl = () => {
  const env = getShopifyEnv();
  return `${env.appUrl.replace(/\/$/, '')}/shopifyAuthCallback`;
};

export const buildInstallUrl = (shop: string, state: string) => {
  const env = getShopifyEnv();
  const redirectUri = buildCallbackUrl();
  const params = new URLSearchParams({
    client_id: env.apiKey,
    scope: env.scopes.join(','),
    redirect_uri: redirectUri,
    state
  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
};

export const hashInstallState = (state: string) => crypto.createHash('sha256').update(state).digest('hex');

export const verifyCallbackHmac = (params: URLSearchParams) => {
  const { apiSecret } = getShopifyEnv();
  const providedHmac = params.get('hmac');

  if (!apiSecret || !providedHmac) {
    return false;
  }

  const message = [...params.entries()]
    .filter(([key]) => key !== 'hmac' && key !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const digest = crypto.createHmac('sha256', apiSecret).update(message, 'utf8').digest('hex');
  return digest.length === providedHmac.length && crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(providedHmac));
};

export const exchangeAccessToken = async (shop: string, code: string) => {
  const env = getShopifyEnv();
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

  const payload = await response.json() as {
    access_token?: string;
    scope?: string;
    associated_user_scope?: string;
  };

  return {
    accessToken: payload.access_token || '',
    scope: payload.scope || payload.associated_user_scope || ''
  };
};
