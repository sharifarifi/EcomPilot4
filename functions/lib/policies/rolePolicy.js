"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRole = exports.SHOPIFY_OPERATION_ROLES = void 0;
// Shopify operasyon endpoint'leri için bilinçli olarak dar yetki seti.
// CEO ve Director rollerinin uygulama genelinde yönetim erişimi olabilir;
// ancak Shopify manual sync / connection test gibi operasyonlar yalnız ADMIN ve MANAGER ile sınırlandırılır.
exports.SHOPIFY_OPERATION_ROLES = new Set(['ADMIN', 'MANAGER']);
const normalizeRole = (role) => String(role || '').trim().toUpperCase();
exports.normalizeRole = normalizeRole;
