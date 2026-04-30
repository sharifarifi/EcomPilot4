"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidatedShopDomain = void 0;
const _authz_js_1 = require("./_authz.js");
const shopifyAuth_js_1 = require("../shopify/shopifyAuth.js");
const getValidatedShopDomain = (req) => {
    const rawShop = String(req.query.shop || req.body?.shop || '').trim();
    if (!rawShop) {
        throw new _authz_js_1.HttpError(400, 'invalid_input', 'Missing shop domain.');
    }
    const shopDomain = (0, shopifyAuth_js_1.normalizeShopDomain)(rawShop);
    if (!(0, shopifyAuth_js_1.isValidShopDomain)(shopDomain)) {
        throw new _authz_js_1.HttpError(400, 'invalid_input', 'Invalid shop domain.');
    }
    return shopDomain;
};
exports.getValidatedShopDomain = getValidatedShopDomain;
