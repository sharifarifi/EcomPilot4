"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCustomers = void 0;
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const syncCustomers = async (shopDomain) => {
    const startedAt = new Date().toISOString();
    await firebaseAdmin_js_1.adminDb.collection('sync_states').doc(`shopify-customers-${shopDomain || 'unknown'}`).set({
        source: 'shopify',
        resource: 'customers',
        shopDomain,
        status: 'todo',
        startedAt,
        message: 'TODO: Shopify müşteri senkronizasyonu henüz implement edilmedi.'
    }, { merge: true });
    return { resource: 'customers', status: 'todo', startedAt };
};
exports.syncCustomers = syncCustomers;
