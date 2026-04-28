"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionTest = void 0;
const shopifyClient_js_1 = require("../shopify/shopifyClient.js");
const connectionTest = async (req, res) => {
    const shopDomain = String(req.query.shop || req.body?.shop || '').trim();
    const accessToken = typeof req.body?.accessToken === 'string' ? req.body.accessToken : undefined;
    if (!shopDomain) {
        res.status(400).json({ error: 'Missing shop domain.' });
        return;
    }
    const client = (0, shopifyClient_js_1.createShopifyAdminClient)(shopDomain, accessToken);
    const result = await (0, shopifyClient_js_1.testShopConnection)(client);
    res.status(200).json({
        shopDomain,
        ...result
    });
};
exports.connectionTest = connectionTest;
