"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncProducts = void 0;
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const productsRepo_js_1 = require("../firestore/productsRepo.js");
const shopifyClient_js_1 = require("../shopify/shopifyClient.js");
const shopifyMapper_js_1 = require("../shopify/shopifyMapper.js");
const syncProducts = async (shopDomain, accessToken) => {
    const startedAt = new Date().toISOString();
    const client = (0, shopifyClient_js_1.createShopifyAdminClient)(shopDomain, accessToken);
    const syncStateRef = firebaseAdmin_js_1.adminDb.collection('sync_states').doc(`shopify-products-${shopDomain || 'unknown'}`);
    let nextPageCursor = null;
    let pageCount = 0;
    let syncedCount = 0;
    let fetchMode = 'placeholder';
    do {
        const page = await (0, shopifyClient_js_1.fetchProductsPage)(client, nextPageCursor);
        fetchMode = page.mode;
        pageCount += 1;
        const normalizedProducts = page.products
            .map((product) => (0, shopifyMapper_js_1.mapShopifyProduct)(product, { storeId: shopDomain, syncedAt: startedAt }))
            .filter((product) => product.shopifyProductId);
        const result = await (0, productsRepo_js_1.saveShopifyProducts)(normalizedProducts);
        syncedCount += result.savedCount;
        nextPageCursor = page.nextPageCursor;
    } while (nextPageCursor && pageCount < 25);
    const status = fetchMode === 'placeholder' ? 'skipped' : 'completed';
    const message = fetchMode === 'placeholder'
        ? 'TODO: Shopify ürün API çağrısı doğrulanmadığı için placeholder paginated sync yapısı çalıştı.'
        : 'Shopify ürün senkronizasyonu tamamlandı.';
    await syncStateRef.set({
        source: 'shopify',
        resource: 'products',
        shopDomain,
        status,
        startedAt,
        completedAt: new Date().toISOString(),
        pageCount,
        syncedCount,
        message
    }, { merge: true });
    return { resource: 'products', status, startedAt, pageCount, syncedCount };
};
exports.syncProducts = syncProducts;
