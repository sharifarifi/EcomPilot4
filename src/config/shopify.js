const normalizeShopDomain = (value = '') => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';

  return trimmed
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .replace(/\/.*$/, '');
};

const getOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'http://localhost:5173';
};

const getFunctionsBaseUrl = () => (import.meta.env.VITE_SHOPIFY_FUNCTIONS_BASE_URL || '').trim().replace(/\/$/, '');

const buildFunctionsUrl = (path) => {
  const baseUrl = getFunctionsBaseUrl();
  if (!baseUrl) {
    throw new Error('VITE_SHOPIFY_FUNCTIONS_BASE_URL tanımlanmadı.');
  }

  return `${baseUrl}/${path.replace(/^\//, '')}`;
};

export const shopifyConfig = {
  defaultShopDomain: normalizeShopDomain(import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || ''),
  appOrigin: getOrigin(),
  functionsBaseUrl: getFunctionsBaseUrl(),
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

  return `${buildFunctionsUrl('shopifyStartInstall')}?${params.toString()}`;
};

export { normalizeShopDomain };
