"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualSync = void 0;
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const axios_1 = __importDefault(require("axios"));
const manualSync = async (req, res) => {
    const shop = String(req.query.shop || '').trim();
    if (!shop) {
        res.status(400).send('Shop domain gerekli.');
        return;
    }
    try {
        const storeDoc = await firebaseAdmin_js_1.adminDb.collection('shopify_stores').doc(shop).get();
        if (!storeDoc.exists) {
            res.status(404).send('Mağaza veritabanında bulunamadı.');
            return;
        }
        const storeData = storeDoc.data();
        const accessToken = storeData?.accessToken;
        if (!accessToken) {
            res.status(400).send('Mağaza için Access Token bulunamadı.');
            return;
        }
        const response = await axios_1.default.get(`https://${shop}/admin/api/2024-04/orders.json?status=any&limit=50`, { headers: { 'X-Shopify-Access-Token': accessToken } });
        const orders = response.data.orders;
        const batch = firebaseAdmin_js_1.adminDb.batch();
        orders.forEach((order) => {
            const orderRef = firebaseAdmin_js_1.adminDb.collection('shopify_orders').doc(String(order.id));
            batch.set(orderRef, {
                order_id: order.id,
                order_number: order.name,
                total_price: order.total_price,
                currency: order.currency,
                customer: order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Müşteri Bilgisi Yok',
                created_at: order.created_at,
                financial_status: order.financial_status,
                fulfillment_status: order.fulfillment_status || 'unfulfilled',
                shopDomain: shop,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        });
        await batch.commit();
        res.status(200).json({
            success: true,
            message: `${orders.length} adet sipariş başarıyla senkronize edildi.`
        });
    }
    catch (error) {
        console.error("❌ Sync Hatası:", error.response?.data || error.message);
        res.status(500).json({ error: 'Siparişler çekilirken bir hata oluştu.' });
    }
};
exports.manualSync = manualSync;
