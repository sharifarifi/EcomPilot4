"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncOrders = void 0;
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const ordersRepo_js_1 = require("../firestore/ordersRepo.js");
const shopifyClient_js_1 = require("../shopify/shopifyClient.js");
const shopifyMapper_js_1 = require("../shopify/shopifyMapper.js");
const syncOrders = async (shopDomain, accessToken) => {
    const startedAt = new Date().toISOString();
    const client = (0, shopifyClient_js_1.createShopifyAdminClient)(shopDomain, accessToken);
    const syncStateRef = firebaseAdmin_js_1.adminDb.collection('sync_states').doc(`shopify-orders-${shopDomain || 'unknown'}`);
    let nextPageCursor = null;
    let pageCount = 0;
    let syncedCount = 0;
    let fetchMode = 'placeholder';
    do {
        const page = await (0, shopifyClient_js_1.fetchOrdersPage)(client, nextPageCursor);
        fetchMode = page.mode;
        pageCount += 1;
        const normalizedOrders = page.orders
            .map((order) => (0, shopifyMapper_js_1.mapShopifyOrder)(order, { storeId: shopDomain, syncedAt: startedAt }))
            .filter((order) => order.shopifyOrderId);
        const result = await (0, ordersRepo_js_1.saveShopifyOrders)(normalizedOrders);
        syncedCount += result.savedCount;
        nextPageCursor = page.nextPageCursor;
    } while (nextPageCursor && pageCount < 25);
    const status = fetchMode === 'placeholder' ? 'skipped' : 'completed';
    const message = fetchMode === 'placeholder'
        ? 'TODO: Shopify sipariş API çağrısı doğrulanmadığı için placeholder paginated sync yapısı çalıştı.'
        : 'Shopify sipariş senkronizasyonu tamamlandı.';
    await syncStateRef.set({
        source: 'shopify',
        resource: 'orders',
        shopDomain,
        status,
        startedAt,
        completedAt: new Date().toISOString(),
        pageCount,
        syncedCount,
        message
    }, { merge: true });
    return { resource: 'orders', status, startedAt, pageCount, syncedCount };
};
exports.syncOrders = syncOrders;
