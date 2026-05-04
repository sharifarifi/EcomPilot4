const normalizeShopDomain = (value = '') => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';

  return trimmed
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .replace(/\/.*$/, '');
};

const isValidShopifyDomain = (value = '') => /\.myshopify\.com$/i.test(normalizeShopDomain(value));

const resolveShopDomain = (...candidates) => {
  for (const candidate of candidates) {
    const normalized = normalizeShopDomain(String(candidate || ''));
    if (!normalized) continue;
    if (isValidShopifyDomain(normalized)) return normalized;
    if (/cloudfunctions\.net$|vercel\.app$|firebaseapp\.com$/i.test(normalized)) {
      console.warn('[shopify-config] Geçersiz shop domain algılandı, yok sayılıyor:', normalized);
      continue;
    }
  }

  return 'z50nyc-dm.myshopify.com';
};

const getOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'http://localhost:5173';
};

const getDerivedFunctionsBaseUrl = () => {
  const origin = getOrigin();
  const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();

  const sameOriginApi = `${origin.replace(/\/$/, '')}/api/shopify`;

  if (/localhost|127\.0\.0\.1/.test(origin)) {
    return sameOriginApi;
  }

  if (projectId) {
    return `https://us-central1-${projectId}.cloudfunctions.net`;
  }

  if (/vercel\.app$/i.test(new URL(origin).hostname)) {
    console.warn('VITE_SHOPIFY_FUNCTIONS_BASE_URL eksik. Vercel ortamında varsayılan /api/shopify endpointi deneniyor.');
    return sameOriginApi;
  }

  return sameOriginApi;
};

const getFunctionsBaseUrl = () => (
  (import.meta.env.VITE_SHOPIFY_FUNCTIONS_BASE_URL || '').trim().replace(/\/$/, '') || getDerivedFunctionsBaseUrl()
);

const buildFunctionsUrl = (path) => {
  const baseUrl = getFunctionsBaseUrl();
  if (!baseUrl) {
    throw new Error('Shopify Functions endpoint bulunamadı. VITE_SHOPIFY_FUNCTIONS_BASE_URL tanımlayın.');
  }

  return `${baseUrl}/${path.replace(/^\//, '')}`;
};

export const buildShopifyFunctionUrl = (path) => buildFunctionsUrl(path);

export const shopifyConfig = {
  defaultShopDomain: resolveShopDomain(import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || ''),
  appOrigin: getOrigin(),
  functionsBaseUrl: getFunctionsBaseUrl(),
  functionsBaseUrlSource: (import.meta.env.VITE_SHOPIFY_FUNCTIONS_BASE_URL || '').trim() ? 'env' : 'derived',
};

export const buildShopifyStartInstallUrl = ({
  shopDomain,
  returnTo = '/?shopify=oauth',
} = {}) => {
  const normalizedShop = normalizeShopDomain(shopDomain || shopifyConfig.defaultShopDomain);
  if (!normalizedShop) {
    throw new Error('Shopify mağaza domaini gerekli.');
  }

  if (!/\.myshopify\.com$/i.test(normalizedShop)) {
    throw new Error('Geçerli bir .myshopify.com domaini girin.');
  }

  const params = new URLSearchParams({
    shop: normalizedShop,
    returnTo,
  });

  const path = shopifyConfig.functionsBaseUrl.includes('/api/shopify') ? 'start-install' : 'shopifyStartInstall';
  return `${buildFunctionsUrl(path)}?${params.toString()}`;
};

export { normalizeShopDomain };
export { isValidShopifyDomain, resolveShopDomain };
