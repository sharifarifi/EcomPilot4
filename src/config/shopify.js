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

export const shopifyConfig = {
  defaultShopDomain: normalizeShopDomain(import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || ''),
  installEndpoint: (import.meta.env.VITE_SHOPIFY_INSTALL_ENDPOINT || '/api/shopify/install').trim(),
  redirectUri: (import.meta.env.VITE_SHOPIFY_REDIRECT_URI || `${getOrigin()}/integrations/shopify/callback`).trim(),
};

export const buildShopifyInstallUrl = ({
  shopDomain,
  redirectUri = shopifyConfig.redirectUri,
  installEndpoint = shopifyConfig.installEndpoint,
  returnTo,
} = {}) => {
  const normalizedShop = normalizeShopDomain(shopDomain || shopifyConfig.defaultShopDomain);
  if (!normalizedShop) {
    throw new Error('Shopify mağaza domaini gerekli.');
  }

  const params = new URLSearchParams({
    shop: normalizedShop,
    redirectUri,
  });

  if (returnTo) {
    params.set('returnTo', returnTo);
  }

  return `${installEndpoint}?${params.toString()}`;
};

export { normalizeShopDomain };
