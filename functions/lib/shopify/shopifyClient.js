"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchOrdersPage = exports.fetchProductsPage = exports.testShopConnection = exports.createShopifyAdminClient = void 0;
const createShopifyAdminClient = (shopDomain, accessToken) => ({
    shopDomain,
    accessToken
});
exports.createShopifyAdminClient = createShopifyAdminClient;
const testShopConnection = async (client) => {
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
exports.testShopConnection = testShopConnection;
const fetchProductsPage = async (_client, _pageCursor) => ({
    products: [],
    nextPageCursor: null,
    mode: 'placeholder'
});
exports.fetchProductsPage = fetchProductsPage;
const fetchOrdersPage = async (_client, _pageCursor) => ({
    orders: [],
    nextPageCursor: null,
    mode: 'placeholder'
});
exports.fetchOrdersPage = fetchOrdersPage;
