"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAll = void 0;
const syncCustomers_js_1 = require("./syncCustomers.js");
const syncInventory_js_1 = require("./syncInventory.js");
const syncOrders_js_1 = require("./syncOrders.js");
const syncProducts_js_1 = require("./syncProducts.js");
const syncAll = async (shopDomain) => {
    const [orders, products, customers, inventory] = await Promise.all([
        (0, syncOrders_js_1.syncOrders)(shopDomain),
        (0, syncProducts_js_1.syncProducts)(shopDomain),
        (0, syncCustomers_js_1.syncCustomers)(shopDomain),
        (0, syncInventory_js_1.syncInventory)(shopDomain)
    ]);
    return {
        shopDomain,
        results: [orders, products, customers, inventory]
    };
};
exports.syncAll = syncAll;
