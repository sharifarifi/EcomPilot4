"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCallback = void 0;
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const env_js_1 = require("../config/env.js");
const shopifyAuth_js_1 = require("../shopify/shopifyAuth.js");
const buildReturnUrl = (returnTo, status, shop) => {
    const { appBaseUrl } = (0, env_js_1.getBackendEnv)();
    const base = appBaseUrl.replace(/\/$/, '');
    const normalizedReturnTo = returnTo.startsWith('/') ? returnTo : `/${returnTo}`;
    const nextUrl = new URL(`${base}${normalizedReturnTo}`);
    nextUrl.searchParams.set('shopify', status);
    nextUrl.searchParams.set('shop', shop);
    return nextUrl.toString();
};
const authCallback = async (req, res) => {
    const params = new URLSearchParams(req.query);
    const shop = (0, shopifyAuth_js_1.normalizeShopDomain)(String(req.query.shop || '').trim());
    const code = String(req.query.code || '').trim();
    const state = String(req.query.state || '').trim();
    if (!shop || !code || !state || !(0, shopifyAuth_js_1.isValidShopDomain)(shop)) {
        res.status(400).json({ error: 'Missing or invalid callback parameters.' });
        return;
    }
    if (!(0, shopifyAuth_js_1.verifyCallbackHmac)(params)) {
        res.status(400).json({ error: 'Invalid Shopify callback signature.' });
        return;
    }
    const stateHash = (0, shopifyAuth_js_1.hashInstallState)(state);
    const installSessionRef = firebaseAdmin_js_1.adminDb.collection('shopify_install_sessions').doc(stateHash);
    const installSession = await installSessionRef.get();
    if (!installSession.exists) {
        res.status(400).json({ error: 'Invalid or expired install state.' });
        return;
    }
    const installSessionData = installSession.data();
    const returnTo = String(installSessionData?.returnTo || '/?shopify=oauth');
    if (installSessionData?.shopDomain && installSessionData.shopDomain !== shop) {
        res.status(400).json({ error: 'Install state does not match requested shop.' });
        return;
    }
    let grantedScopes = [];
    let tokenExchangeStatus = 'skipped';
    let callbackMessage = 'Callback alındı. Güvenli metadata kaydedildi.';
    try {
        const tokenResponse = await (0, shopifyAuth_js_1.exchangeAccessToken)(shop, code);
        grantedScopes = tokenResponse.scope.split(',').map((scope) => scope.trim()).filter(Boolean);
        tokenExchangeStatus = tokenResponse.accessToken ? 'succeeded' : 'failed';
        callbackMessage = tokenResponse.accessToken
            ? 'OAuth callback tamamlandı. Access token alındı ancak bu iskelet sürümünde saklanmadı.'
            : 'OAuth callback tamamlandı ancak access token dönmedi.';
    }
    catch (error) {
        tokenExchangeStatus = 'failed';
        callbackMessage = error instanceof Error ? error.message : 'Token exchange başarısız oldu.';
    }
    const updatedAt = new Date().toISOString();
    const isConnected = tokenExchangeStatus === 'succeeded';
    const connectionState = isConnected ? 'connected' : 'pending_secure_storage';
    await firebaseAdmin_js_1.adminDb.collection('shopify_stores').doc(shop).set({
        shopDomain: shop,
        connectionState,
        connected: isConnected,
        grantedScopes,
        authCodeReceivedAt: updatedAt,
        tokenExchangeStatus,
        updatedAt,
        lastError: tokenExchangeStatus === 'failed' ? callbackMessage : null,
        note: isConnected
            ? 'Access token bu iskelet sürümünde Firestore plaintext olarak saklanmaz.'
            : 'TODO: Güvenli token saklama katmanı henüz implement edilmedi.'
    }, { merge: true });
    await firebaseAdmin_js_1.adminDb.collection('settings').doc('integrations').set({
        1: {
            connected: isConnected,
            connectionState,
            status: isConnected ? 'connected' : 'pending',
            shopDomain: shop,
            grantedScopes,
            lastError: tokenExchangeStatus === 'failed' ? callbackMessage : null,
            updatedAt,
            authCodeReceivedAt: updatedAt,
        }
    }, { merge: true });
    await installSessionRef.set({
        status: tokenExchangeStatus,
        completedAt: updatedAt,
        shopDomain: shop
    }, { merge: true });
    res.redirect(buildReturnUrl(returnTo, tokenExchangeStatus, shop));
};
exports.authCallback = authCallback;
