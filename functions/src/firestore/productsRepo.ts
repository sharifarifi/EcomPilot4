import { adminDb } from '../config/firebaseAdmin.js';
import type { NormalizedShopifyProduct } from '../shopify/shopifyMapper.js';

const getProductDocId = (storeId: string, shopifyProductId: string) => `${storeId}__${shopifyProductId}`;

export const saveShopifyProducts = async (products: NormalizedShopifyProduct[]) => {
  if (products.length === 0) {
    return { savedCount: 0 };
  }

  const batch = adminDb.batch();

  products.forEach((product) => {
    const docRef = adminDb.collection('shopify_products').doc(getProductDocId(product.storeId, product.shopifyProductId));
    batch.set(docRef, product, { merge: true });
  });

  await batch.commit();

  return { savedCount: products.length };
};
