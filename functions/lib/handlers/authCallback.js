"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCallback = void 0;
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const env_js_1 = require("../config/env.js");
const shopifyAuth_js_1 = require("../shopify/shopifyAuth.js");
const authCallback = async (req, res) => {
    const params = new URLSearchParams(req.query);
    const shop = (0, shopifyAuth_js_1.normalizeShopDomain)(String(req.query.shop || '').trim());
    const code = String(req.query.code || '').trim();
    const state = String(req.query.state || '').trim();
    // 1. Temel Parametre Kontrolü
    if (!shop || !code || !state || !(0, shopifyAuth_js_1.isValidShopDomain)(shop)) {
        return res.status(400).json({ error: 'Missing callback parameters.' });
    }
    // 2. Güvenlik Kontrolü (HMAC)
    if (!(0, shopifyAuth_js_1.verifyCallbackHmac)(params)) {
        return res.status(400).json({ error: 'Invalid Shopify signature.' });
    }
    // 3. Session Kontrolü (Güvenlik için yükleme oturumunu doğrula)
    const stateHash = (0, shopifyAuth_js_1.hashInstallState)(state);
    const installSessionRef = firebaseAdmin_js_1.adminDb.collection('shopify_install_sessions').doc(stateHash);
    const installSession = await installSessionRef.get();
    if (!installSession.exists) {
        return res.status(400).json({ error: 'Invalid install state.' });
    }
    try {
        // 4. Shopify'dan Access Token'ı al (En kritik adım)
        const tokenResponse = await (0, shopifyAuth_js_1.exchangeAccessToken)(shop, code);
        const updatedAt = new Date().toISOString();
        // 5. Veritabanına Kaydet (Eksik olan kısım burasıydı)
        await firebaseAdmin_js_1.adminDb.collection('shopify_stores').doc(shop).set({
            shopDomain: shop,
            accessToken: tokenResponse.accessToken, // Anahtarı buraya kaydediyoruz
            scopes: tokenResponse.scope,
            status: 'active',
            isConnected: true,
            updatedAt
        }, { merge: true });
        // Panel ayarlarını güncelle
        await firebaseAdmin_js_1.adminDb.collection('settings').doc('integrations').set({
            shopify: {
                connected: true,
                shopDomain: shop,
                updatedAt
            }
        }, { merge: true });
        // 6. Oturumu temizle ve yönlendir
        await installSessionRef.update({ status: 'succeeded', completedAt: updatedAt });
        const { appBaseUrl } = (0, env_js_1.getBackendEnv)();
        res.redirect(`${appBaseUrl.replace(/\/$/, '')}/?shopify=succeeded&shop=${shop}`);
    }
    catch (error) {
        console.error("❌ Auth Hatası:", error.message);
        res.status(500).json({ error: 'Token exchange failed', details: error.message });
    }
};
exports.authCallback = authCallback;
