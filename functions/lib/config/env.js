"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShopifyEnv = exports.assertBackendEnv = exports.hasShopifyEnv = exports.getMissingBackendEnvKeys = exports.getBackendEnv = void 0;
// Yeni bilgilerini doğrudan buraya tanımlıyoruz (Hardcoded bypass)
const NEW_CLIENT_ID = "a24af7081cbfad1b1ef1f07a617969d3";
const NEW_CLIENT_SECRET = "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";
const getBackendEnv = () => {
    return {
        // Vercel Linkin
        appBaseUrl: "https://ecom-pilot4-mej9pmty9-sharifarifis-projects.vercel.app",
        firebaseProjectId: "ecom-prototip",
        // Shopify App URL (startInstall fonksiyonun)
        appUrl: "https://shopifystartinstall-bi372exr4a-uc.a.run.app",
        // YENİ KİMLİK BİLGİLERİ
        apiKey: NEW_CLIENT_ID,
        apiSecret: NEW_CLIENT_SECRET,
        // İzinler (Scopes)
        scopes: [
            "read_orders", "write_orders",
            "read_products", "write_products",
            "read_customers", "write_customers",
            "read_inventory", "write_inventory"
        ],
        webhookSecret: NEW_CLIENT_SECRET
    };
};
exports.getBackendEnv = getBackendEnv;
const getMissingBackendEnvKeys = () => []; // Manuel doldurduğumuz için boş dönüyoruz
exports.getMissingBackendEnvKeys = getMissingBackendEnvKeys;
const hasShopifyEnv = () => true;
exports.hasShopifyEnv = hasShopifyEnv;
const assertBackendEnv = () => (0, exports.getBackendEnv)();
exports.assertBackendEnv = assertBackendEnv;
const getShopifyEnv = () => (0, exports.getBackendEnv)();
exports.getShopifyEnv = getShopifyEnv;
