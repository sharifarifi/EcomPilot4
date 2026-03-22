export type ShopifyAdminClient = {
  shopDomain: string;
  accessToken?: string;
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
