"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveShopifyProducts = void 0;
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const getProductDocId = (storeId, shopifyProductId) => `${storeId}__${shopifyProductId}`;
const saveShopifyProducts = async (products) => {
    if (products.length === 0) {
        return { savedCount: 0 };
    }
    const batch = firebaseAdmin_js_1.adminDb.batch();
    products.forEach((product) => {
        const docRef = firebaseAdmin_js_1.adminDb.collection('shopify_products').doc(getProductDocId(product.storeId, product.shopifyProductId));
        batch.set(docRef, product, { merge: true });
    });
    await batch.commit();
    return { savedCount: products.length };
};
exports.saveShopifyProducts = saveShopifyProducts;
