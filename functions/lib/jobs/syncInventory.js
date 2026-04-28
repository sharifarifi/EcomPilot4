"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncInventory = void 0;
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const syncInventory = async (shopDomain) => {
    const startedAt = new Date().toISOString();
    await firebaseAdmin_js_1.adminDb.collection('sync_states').doc(`shopify-inventory-${shopDomain || 'unknown'}`).set({
        source: 'shopify',
        resource: 'inventory',
        shopDomain,
        status: 'todo',
        startedAt,
        message: 'TODO: Shopify stok senkronizasyonu henüz implement edilmedi.'
    }, { merge: true });
    return { resource: 'inventory', status: 'todo', startedAt };
};
exports.syncInventory = syncInventory;
