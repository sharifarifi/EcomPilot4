"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionTest = void 0;
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const shopifyClient_js_1 = require("../shopify/shopifyClient.js");
const _authz_js_1 = require("./_authz.js");
const _validation_js_1 = require("./_validation.js");
const connectionTest = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'method_not_allowed' });
        return;
    }
    try {
        await (0, _authz_js_1.requireManagementAuth)(req);
        const shopDomain = (0, _validation_js_1.getValidatedShopDomain)(req);
        // Güvenlik gereği accessToken client body'den alınmaz.
        // Eğer ileride güvenli token saklama eklenecekse buradan okunmalıdır.
        const storeSnapshot = await firebaseAdmin_js_1.adminDb.collection('shopify_stores').doc(shopDomain).get();
        const storeData = storeSnapshot.exists ? storeSnapshot.data() : null;
        const persistedAccessToken = typeof storeData?.accessToken === 'string' ? storeData.accessToken : undefined;
        if (!persistedAccessToken) {
            res.status(200).json({
                ok: false,
                code: 'missing_connection_token',
                message: 'Shopify bağlantı tokenı bulunamadı. Entegrasyonu yeniden bağlayın veya OAuth token saklama akışını tamamlayın.'
            });
            return;
        }
        const client = (0, shopifyClient_js_1.createShopifyAdminClient)(shopDomain, persistedAccessToken);
        const result = await (0, shopifyClient_js_1.testShopConnection)(client);
        res.status(200).json({
            shopDomain,
            ok: result.ok,
            message: result.ok ? 'connection_ok' : 'connection_check_failed'
        });
    }
    catch (error) {
        if (error instanceof _authz_js_1.HttpError) {
            res.status(error.status).json({ error: error.code });
            return;
        }
        res.status(502).json({ error: 'upstream_error' });
    }
};
exports.connectionTest = connectionTest;
