// Shopify operasyon endpoint'leri için bilinçli olarak dar yetki seti.
// CEO ve Director rollerinin uygulama genelinde yönetim erişimi olabilir;
// ancak Shopify manual sync / connection test gibi operasyonlar yalnız ADMIN ve MANAGER ile sınırlandırılır.
export const SHOPIFY_OPERATION_ROLES = new Set(['ADMIN', 'MANAGER']);

export const normalizeRole = (role: unknown) => String(role || '').trim().toUpperCase();
