"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveShopifyOrders = void 0;
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const getOrderDocId = (storeId, shopifyOrderId) => `${storeId}__${shopifyOrderId}`;
const saveShopifyOrders = async (orders) => {
    if (orders.length === 0) {
        return { savedCount: 0 };
    }
    const batch = firebaseAdmin_js_1.adminDb.batch();
    orders.forEach((order) => {
        const docRef = firebaseAdmin_js_1.adminDb.collection('shopify_orders').doc(getOrderDocId(order.storeId, order.shopifyOrderId));
        batch.set(docRef, order, { merge: true });
    });
    await batch.commit();
    return { savedCount: orders.length };
};
exports.saveShopifyOrders = saveShopifyOrders;
