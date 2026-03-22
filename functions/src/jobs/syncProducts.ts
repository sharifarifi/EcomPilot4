import { adminDb } from '../config/firebaseAdmin.js';
import { saveShopifyProducts } from '../firestore/productsRepo.js';
import { fetchProductsPage, createShopifyAdminClient } from '../shopify/shopifyClient.js';
import { mapShopifyProduct } from '../shopify/shopifyMapper.js';

export const syncProducts = async (shopDomain: string, accessToken?: string) => {
  const startedAt = new Date().toISOString();
  const client = createShopifyAdminClient(shopDomain, accessToken);
  const syncStateRef = adminDb.collection('sync_states').doc(`shopify-products-${shopDomain || 'unknown'}`);

  let nextPageCursor: string | null = null;
  let pageCount = 0;
  let syncedCount = 0;
  let fetchMode: 'placeholder' = 'placeholder';

  do {
    const page = await fetchProductsPage(client, nextPageCursor);
    fetchMode = page.mode;
    pageCount += 1;

    const normalizedProducts = page.products
      .map((product) => mapShopifyProduct(product, { storeId: shopDomain, syncedAt: startedAt }))
      .filter((product) => product.shopifyProductId);

    const result = await saveShopifyProducts(normalizedProducts);
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
