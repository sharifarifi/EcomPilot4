import { syncCustomers } from './syncCustomers.js';
import { syncInventory } from './syncInventory.js';
import { syncOrders } from './syncOrders.js';
import { syncProducts } from './syncProducts.js';

export const syncAll = async (shopDomain: string) => {
  const [orders, products, customers, inventory] = await Promise.all([
    syncOrders(shopDomain),
    syncProducts(shopDomain),
    syncCustomers(shopDomain),
    syncInventory(shopDomain)
  ]);

  return {
    shopDomain,
    results: [orders, products, customers, inventory]
  };
};
