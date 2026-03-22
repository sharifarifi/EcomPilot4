export type ShopifyAdminClient = {
  shopDomain: string;
  accessToken?: string;
};

export type ShopifyProductVariantPayload = Record<string, unknown>;
export type ShopifyProductPayload = Record<string, unknown> & {
  id?: string | number;
  title?: string;
  status?: string;
  vendor?: string;
  updated_at?: string;
  variants?: ShopifyProductVariantPayload[];
  image?: Record<string, unknown> | null;
  images?: Record<string, unknown>[];
};

export type ShopifyProductsPage = {
  products: ShopifyProductPayload[];
  nextPageCursor: string | null;
  mode: 'placeholder';
};

export const createShopifyAdminClient = (shopDomain: string, accessToken?: string): ShopifyAdminClient => ({
  shopDomain,
  accessToken
});

export const testShopConnection = async (client: ShopifyAdminClient) => {
  if (!client.shopDomain) {
    throw new Error('Shop domain is required.');
  }

  return {
    ok: Boolean(client.shopDomain && client.accessToken),
    message: client.accessToken
      ? 'TODO: Gerçek Shopify API test isteği eklenmeli.'
      : 'Access token olmadığı için yalnızca iskelet doğrulama yapıldı.'
  };
};

export const fetchProductsPage = async (
  _client: ShopifyAdminClient,
  _pageCursor?: string | null
): Promise<ShopifyProductsPage> => ({
  products: [],
  nextPageCursor: null,
  mode: 'placeholder'
});
