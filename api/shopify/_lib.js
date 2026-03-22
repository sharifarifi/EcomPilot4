import crypto from 'node:crypto';

const COOKIE_NAME = 'shopify_oauth_ctx';

export const normalizeShopDomain = (shop = '') => (
  String(shop)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
);

export const isValidShopDomain = (shop) => /\.myshopify\.com$/i.test(normalizeShopDomain(shop));

export const getEnv = () => ({
  appBaseUrl: String(process.env.APP_BASE_URL || '').trim(),
  apiKey: String(process.env.SHOPIFY_API_KEY || '').trim(),
  apiSecret: String(process.env.SHOPIFY_API_SECRET || '').trim(),
  scopes: String(process.env.SHOPIFY_APP_SCOPES || '').split(',').map((scope) => scope.trim()).filter(Boolean),
  firebaseProjectId: String(process.env.FIREBASE_PROJECT_ID || '').trim(),
  clientEmail: String(process.env.FIREBASE_CLIENT_EMAIL || '').trim(),
  privateKey: String(process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
});

export const getRequestOrigin = (req) => {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}`;
};

export const getAppBaseUrl = (req) => getEnv().appBaseUrl || getRequestOrigin(req);

export const createInstallState = () => crypto.randomBytes(16).toString('hex');
export const hashInstallState = (state) => crypto.createHash('sha256').update(state).digest('hex');

const base64UrlEncode = (value) => Buffer.from(value).toString('base64url');
const base64UrlDecode = (value) => Buffer.from(value, 'base64url').toString('utf8');

const signPayload = (payload) => crypto.createHmac('sha256', getEnv().apiSecret).update(payload, 'utf8').digest('hex');

export const serializeInstallContext = (context) => {
  const payload = base64UrlEncode(JSON.stringify(context));
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
};

export const parseInstallContext = (rawCookie = '') => {
  if (!rawCookie || !rawCookie.includes('.')) return null;
  const [payload, signature] = rawCookie.split('.');
  if (!payload || !signature) return null;

  const expected = signPayload(payload);
  if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }
};

export const buildCookie = (value, maxAgeSeconds = 600) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
};

export const clearCookie = () => `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

export const getCookieValue = (req) => {
  const cookieHeader = String(req.headers.cookie || '');
  const cookies = cookieHeader.split(';').map((item) => item.trim());
  const match = cookies.find((item) => item.startsWith(`${COOKIE_NAME}=`));
  return match ? match.slice(COOKIE_NAME.length + 1) : '';
};

export const buildCallbackUrl = (req) => `${getAppBaseUrl(req).replace(/\/$/, '')}/api/shopify/callback`;

export const buildInstallUrl = ({ req, shop, state }) => {
  const { apiKey, scopes } = getEnv();
  const params = new URLSearchParams({
    client_id: apiKey,
    scope: scopes.join(','),
    redirect_uri: buildCallbackUrl(req),
    state,
  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
};

export const verifyCallbackHmac = (query) => {
  const { apiSecret } = getEnv();
  const providedHmac = String(query.hmac || '');
  if (!apiSecret || !providedHmac) return false;

  const message = Object.entries(query)
    .filter(([key, value]) => key !== 'hmac' && key !== 'signature' && value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const digest = crypto.createHmac('sha256', apiSecret).update(message, 'utf8').digest('hex');
  return digest.length === providedHmac.length && crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(providedHmac));
};

export const exchangeAccessToken = async ({ shop, code }) => {
  const { apiKey, apiSecret } = getEnv();
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: apiKey, client_secret: apiSecret, code }),
  });

  if (!response.ok) {
    throw new Error(`Shopify token exchange failed with status ${response.status}`);
  }

  const payload = await response.json();
  return {
    accessToken: payload.access_token || '',
    scope: payload.scope || payload.associated_user_scope || '',
  };
};

let adminDbPromise;
export const getAdminDb = async () => {
  if (!adminDbPromise) {
    adminDbPromise = (async () => {
      const { firebaseProjectId, clientEmail, privateKey } = getEnv();
      const { getApps, initializeApp, cert, applicationDefault } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');
      const app = getApps()[0] || initializeApp(
        firebaseProjectId && clientEmail && privateKey
          ? { credential: cert({ projectId: firebaseProjectId, clientEmail, privateKey }) }
          : { credential: applicationDefault() }
      );
      return getFirestore(app);
    })().catch(() => null);
  }
  return adminDbPromise;
};
