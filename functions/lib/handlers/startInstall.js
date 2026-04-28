"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startInstall = void 0;
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const env_js_1 = require("../config/env.js");
const shopifyAuth_js_1 = require("../shopify/shopifyAuth.js");
const startInstall = async (req, res) => {
    const shop = (0, shopifyAuth_js_1.normalizeShopDomain)(String(req.query.shop || '').trim());
    const returnTo = String(req.query.returnTo || '/?shopify=oauth').trim() || '/?shopify=oauth';
    const redirectMode = String(req.query.redirect || '').trim() === '1';
    if (!(0, env_js_1.hasShopifyEnv)()) {
        res.status(500).json({ error: 'Shopify environment variables are not fully configured.' });
        return;
    }
    if (!shop || !(0, shopifyAuth_js_1.isValidShopDomain)(shop)) {
        res.status(400).json({ error: 'Missing or invalid required query parameter: shop' });
        return;
    }
    const state = (0, shopifyAuth_js_1.createInstallState)();
    const installUrl = (0, shopifyAuth_js_1.buildInstallUrl)(shop, state);
    const stateHash = (0, shopifyAuth_js_1.hashInstallState)(state);
    await firebaseAdmin_js_1.adminDb.collection('shopify_install_sessions').doc(stateHash).set({
        shopDomain: shop,
        stateHash,
        returnTo,
        status: 'created',
        createdAt: new Date().toISOString()
    }, { merge: true });
    if (redirectMode) {
        res.redirect(installUrl);
        return;
    }
    res.status(200).json({ shop, state, installUrl, returnTo });
};
exports.startInstall = startInstall;
