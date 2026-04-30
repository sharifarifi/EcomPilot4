"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startInstall = void 0;
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const shopifyAuth_js_1 = require("../shopify/shopifyAuth.js");
const startInstall = async (req, res) => {
    try {
        console.log("1. Fonksiyon başladı");
        const shop = (0, shopifyAuth_js_1.normalizeShopDomain)(String(req.query.shop || '').trim());
        const returnTo = String(req.query.returnTo || '/?shopify=oauth').trim() || '/?shopify=oauth';
        const redirectMode = String(req.query.redirect || '').trim() === '1';
        console.log(`2. Parametreler alındı. Shop: ${shop}, RedirectMode: ${redirectMode}`);
        if (!shop || !(0, shopifyAuth_js_1.isValidShopDomain)(shop)) {
            console.error("❌ Geçersiz dükkan adı!");
            return res.status(400).json({ error: 'Missing or invalid required query parameter: shop' });
        }
        console.log("3. State oluşturuluyor...");
        const state = (0, shopifyAuth_js_1.createInstallState)();
        console.log("4. Install URL oluşturuluyor...");
        // BURASI ÇÖKEBİLİR (Eğer Secrets Manager veya .env eksikse)
        const installUrl = (0, shopifyAuth_js_1.buildInstallUrl)(shop, state);
        console.log("5. URL oluşturuldu:", installUrl);
        const stateHash = (0, shopifyAuth_js_1.hashInstallState)(state);
        console.log("6. Firestore'a yazılıyor...");
        // BURASI ÇÖKEBİLİR (Eğer Firebase Admin yetkisi yoksa)
        await firebaseAdmin_js_1.adminDb.collection('shopify_install_sessions').doc(stateHash).set({
            shopDomain: shop,
            stateHash,
            returnTo,
            status: 'created',
            createdAt: new Date().toISOString()
        }, { merge: true });
        console.log("7. Firestore yazma başarılı.");
        if (redirectMode) {
            console.log("🚀 Yönlendirme tetikleniyor...");
            return res.redirect(installUrl);
        }
        res.status(200).json({ shop, state, installUrl, returnTo });
    }
    catch (err) {
        console.error("🔥 KRİTİK HATA YAKALANDI:");
        console.error("Mesaj:", err.message);
        console.error("Stack:", err.stack);
        res.status(500).json({
            error: "Internal Server Error",
            details: err.message,
            step: "Hata yakalama bloğuna düştü"
        });
    }
};
exports.startInstall = startInstall;
