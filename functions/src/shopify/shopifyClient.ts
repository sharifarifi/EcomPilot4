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

export type ShopifyOrderLineItemPayload = Record<string, unknown>;
export type ShopifyShippingAddressPayload = Record<string, unknown>;
export type ShopifyOrderPayload = Record<string, unknown> & {
  id?: string | number;
  name?: string;
  financial_status?: string;
  fulfillment_status?: string;
  total_price?: string | number;
  currency?: string;
  line_items?: ShopifyOrderLineItemPayload[];
  shipping_address?: ShopifyShippingAddressPayload | null;
  created_at?: string;
  updated_at?: string;
  customer?: Record<string, unknown> | null;
};

export type ShopifyOrdersPage = {
  orders: ShopifyOrderPayload[];
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


export const fetchOrdersPage = async (
  _client: ShopifyAdminClient,
  _pageCursor?: string | null
): Promise<ShopifyOrdersPage> => ({
  orders: [],
  nextPageCursor: null,
  mode: 'placeholder'
});
