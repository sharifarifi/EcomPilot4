import React, { useMemo, useState } from 'react';
import { Loader2, ShoppingBag } from 'lucide-react';
import { buildShopifyInstallUrl, normalizeShopDomain, shopifyConfig } from '../../config/shopify';

const ShopifyInstallButton = ({
  shopDomain,
  returnTo = '/settings?tab=integrations&provider=shopify',
  className = '',
  label = 'Shopify bağla',
  onBeforeRedirect,
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const normalizedShop = useMemo(
    () => normalizeShopDomain(shopDomain || shopifyConfig.defaultShopDomain),
    [shopDomain]
  );

  const handleClick = async () => {
    if (!normalizedShop || isRedirecting) return;

    const installUrl = buildShopifyInstallUrl({
      shopDomain: normalizedShop,
      returnTo,
    });

    setIsRedirecting(true);

    try {
      await onBeforeRedirect?.({ installUrl, shopDomain: normalizedShop });
    } finally {
      window.location.assign(installUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!normalizedShop || isRedirecting}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#95BF47] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#95BF47]/30 transition hover:bg-[#7da63a] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none ${className}`}
    >
      {isRedirecting ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
      {isRedirecting ? 'Shopify yönlendiriliyor...' : label}
    </button>
  );
};

export default ShopifyInstallButton;
