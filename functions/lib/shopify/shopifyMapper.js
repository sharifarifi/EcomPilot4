"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapShopifyInventoryItem = exports.mapShopifyCustomer = exports.mapShopifyProduct = exports.mapShopifyOrder = void 0;
const asRecord = (value) => (value && typeof value === 'object' ? value : {});
const asString = (value) => {
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number')
        return String(value);
    return '';
};
const asNumber = (value) => {
    if (typeof value === 'number')
        return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};
const mapVariant = (payload) => {
    const record = asRecord(payload);
    return {
        shopifyVariantId: asString(record.id),
        title: asString(record.title),
        sku: asString(record.sku),
        price: asString(record.price)
    };
};
const mapLineItem = (payload) => {
    const record = asRecord(payload);
    return {
        shopifyLineItemId: asString(record.id),
        title: asString(record.title),
        sku: asString(record.sku),
        quantity: asNumber(record.quantity),
        price: asString(record.price)
    };
};
const mapShippingAddress = (payload) => {
    const record = asRecord(payload);
    return {
        name: [asString(record.first_name), asString(record.last_name)].filter(Boolean).join(' ').trim(),
        address1: asString(record.address1),
        city: asString(record.city),
        province: asString(record.province),
        zip: asString(record.zip),
        country: asString(record.country)
    };
};
const mapCustomer = (payload) => {
    const record = asRecord(payload);
    return {
        firstName: asString(record.first_name),
        lastName: asString(record.last_name),
        email: asString(record.email),
        phone: asString(record.phone)
    };
};
const getProductImage = (payload) => {
    const directImage = asRecord(payload.image);
    if (asString(directImage.src)) {
        return asString(directImage.src);
    }
    const firstImage = Array.isArray(payload.images) ? asRecord(payload.images[0]) : {};
    return asString(firstImage.src) || null;
};
const mapShopifyOrder = (payload, options) => ({
    source: 'shopify',
    storeId: options.storeId,
    shopifyOrderId: asString(payload.id),
    orderName: asString(payload.name),
    customer: mapCustomer(payload.customer),
    financialStatus: asString(payload.financial_status),
    fulfillmentStatus: asString(payload.fulfillment_status),
    totalPrice: asString(payload.total_price),
    currency: asString(payload.currency),
    lineItems: Array.isArray(payload.line_items) ? payload.line_items.map(mapLineItem) : [],
    shippingAddress: mapShippingAddress(payload.shipping_address),
    createdAtShopify: asString(payload.created_at) || null,
    updatedAtShopify: asString(payload.updated_at) || null,
    syncedAt: options.syncedAt || new Date().toISOString()
});
exports.mapShopifyOrder = mapShopifyOrder;
const mapShopifyProduct = (payload, options) => ({
    shopifyProductId: asString(payload.id),
    title: asString(payload.title),
    status: asString(payload.status),
    vendor: asString(payload.vendor),
    variants: Array.isArray(payload.variants) ? payload.variants.map(mapVariant) : [],
    image: getProductImage(payload),
    updatedAtShopify: asString(payload.updated_at) || null,
    syncedAt: options.syncedAt || new Date().toISOString(),
    storeId: options.storeId
});
exports.mapShopifyProduct = mapShopifyProduct;
const mapShopifyCustomer = (payload) => ({
    id: payload.id,
    source: 'shopify',
    raw: payload
});
exports.mapShopifyCustomer = mapShopifyCustomer;
const mapShopifyInventoryItem = (payload) => ({
    id: payload.id,
    source: 'shopify',
    raw: payload
});
exports.mapShopifyInventoryItem = mapShopifyInventoryItem;
