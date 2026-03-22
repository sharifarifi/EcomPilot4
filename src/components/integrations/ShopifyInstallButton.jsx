import React, { useMemo, useState } from 'react';
import { Loader2, ShoppingBag } from 'lucide-react';
import { buildShopifyStartInstallUrl, normalizeShopDomain, shopifyConfig } from '../../config/shopify';

const ShopifyInstallButton = ({
  shopDomain,
  returnTo = '/?shopify=oauth',
  className = '',
  label = 'Shopify bağla',
  onBeforeRequest,
  onError,
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const normalizedShop = useMemo(
    () => normalizeShopDomain(shopDomain || shopifyConfig.defaultShopDomain),
    [shopDomain]
  );

  const handleClick = async () => {
    if (!normalizedShop || isRedirecting) return;

    setIsRedirecting(true);

    try {
      const startInstallUrl = buildShopifyStartInstallUrl({
        shopDomain: normalizedShop,
        returnTo,
      });

      await onBeforeRequest?.({ shopDomain: normalizedShop, startInstallUrl });

      const response = await fetch(startInstallUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.installUrl) {
        throw new Error(payload.error || 'Shopify install URL alınamadı.');
      }

      window.location.assign(payload.installUrl);
    } catch (error) {
      setIsRedirecting(false);
      onError?.(error instanceof Error ? error : new Error('Shopify yönlendirmesi başarısız oldu.'));
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
      {isRedirecting ? 'Shopify OAuth hazırlanıyor...' : label}
    </button>
  );
};

export default ShopifyInstallButton;
