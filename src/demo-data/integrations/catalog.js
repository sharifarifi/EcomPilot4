import { marketplaceDemoTemplateData } from '../../components/settings/integrations/demoTemplateData/marketplaceDemoData';
import { paymentDemoTemplateData } from '../../components/settings/integrations/demoTemplateData/paymentDemoData';

export const ecommerceData = [
  {
    id: 1,
    name: 'Shopify',
    category: 'E-Ticaret',
    status: 'connected',
    logo: 'S',
    color: 'green',
    desc: 'Global e-ticaret altyapısı (Full Entegrasyon).',
    fields: {
      shopUrl: 'my-store.myshopify.com',
      accessToken: 'shpat_8823xxxxxxxx',
      apiSecret: 'shpss_xxxxxxxx'
    },
    permissions: {
      orders_read: true,
      orders_write: true,
      products_read: true,
      products_write: true,
      customers_read: true,
      inventory_read: true,
      inventory_write: true
    },
    advancedSettings: {
      warehouse_selection: { label: 'Stok Düşülecek Depo (Location)', value: 'Main Warehouse (ID: 8821)', type: 'select', options: ['Main Warehouse (ID: 8821)', 'Istanbul Store (ID: 9921)', 'Ankara Hub (ID: 1120)'] },
      order_prefix: { label: 'Sipariş Numarası Ön eki', value: 'SP-', type: 'input' },
      sync_direction: { label: 'Stok Eşitleme Yönü', value: 'Panel -> Shopify', type: 'select', options: ['Panel -> Shopify', 'Shopify -> Panel', 'Çift Yönlü'] },
      status_mapping_paid: { label: 'Shopify "Paid" Durumu Karşılığı', value: 'Onaylandı', type: 'select', options: ['Onaylandı', 'Hazırlanıyor', 'Tamamlandı'] },
      webhooks_enabled: { label: 'Real-time Webhooks (Canlı Veri)', value: true, type: 'toggle' }
    },
    logs: []
  },
  {
    id: 2,
    name: 'İkas',
    category: 'E-Ticaret',
    status: 'disconnected',
    logo: 'i',
    color: 'indigo',
    desc: 'Yeni nesil, hızlı e-ticaret altyapısı.',
    fields: { clientId: '', clientSecret: '', storeId: '' },
    permissions: { orders: true, products: true, customers: true },
    advancedSettings: {
      syncInterval: { label: 'Eşitleme Aralığı', value: '5 Dakika', type: 'select', options: ['1 Dakika', '5 Dakika', '15 Dakika', '1 Saat'] }
    },
    logs: []
  },
  {
    id: 3,
    name: 'Ticimax',
    category: 'E-Ticaret',
    status: 'disconnected',
    logo: 'T',
    color: 'blue',
    desc: 'Gelişmiş yerli e-ticaret çözümleri.',
    fields: { domain: 'www.sitem.com', memberCode: '', userCode: '', password: '' },
    permissions: { orders: true, products: true, members: false },
    advancedSettings: {
      memberGroup: { label: 'Varsayılan Üye Grubu', value: 'Genel', type: 'input' },
      taxClass: { label: 'KDV Dahil/Hariç Gönderim', value: 'Dahil', type: 'select', options: ['Dahil', 'Hariç'] }
    },
    logs: []
  },
  { id: 4, name: 'WooCommerce', category: 'E-Ticaret', status: 'disconnected', logo: 'W', color: 'purple', desc: 'WordPress tabanlı açık kaynak mağaza.', fields: { consumerKey: '', consumerSecret: '', url: '' }, permissions: { orders: true, products: true }, logs: [] },
  { id: 5, name: 'Ideasoft', category: 'E-Ticaret', status: 'disconnected', logo: 'I', color: 'orange', desc: "Türkiye'nin köklü e-ticaret altyapısı.", fields: { domain: '', token: '' }, permissions: { orders: true }, logs: [] }
];

export const marketplaceData = [
  { id: 10, name: 'Trendyol', category: 'Pazaryeri', status: 'connected', logo: 'T', color: 'orange', desc: "Türkiye'nin lider pazaryeri.", fields: { supplierId: '', apiKey: '', apiSecret: '' }, demoTemplate: marketplaceDemoTemplateData[10], permissions: { orders: true, stock_update: true, price_update: true, questions: true, returns: true }, advancedSettings: { autoConfirm: 'Evet', autoInvoiceUpload: 'Evet', cargoProvider: 'Yurtiçi Kargo' }, logs: [] },
  { id: 11, name: 'Hepsiburada', category: 'Pazaryeri', status: 'disconnected', logo: 'H', color: 'orange', desc: 'Büyük e-ticaret platformu.', fields: { merchantId: '' }, permissions: { orders: true, products: true, claims: false }, logs: [] },
  { id: 12, name: 'N11', category: 'Pazaryeri', status: 'disconnected', logo: 'N', color: 'red', desc: 'Hayat sana gelir.', fields: { apiKey: '', apiSecret: '' }, permissions: { orders: true, products: true }, logs: [] },
  { id: 13, name: 'Amazon TR', category: 'Pazaryeri', status: 'disconnected', logo: 'A', color: 'yellow', desc: 'Dünyanın en büyük pazaryeri.', fields: { sellerId: '', mwsAuthToken: '' }, permissions: { orders: true, inventory: true, buybox_tracking: false }, logs: [] },
  { id: 14, name: 'Çiçeksepeti', category: 'Pazaryeri', status: 'disconnected', logo: 'Ç', color: 'blue', desc: 'Hediye ve çiçek odaklı pazaryeri.', fields: { apiKey: '' }, permissions: { orders: true }, logs: [] }
];

export const logisticsData = [
  { id: 20, name: 'Yurtiçi Kargo', category: 'Lojistik', status: 'connected', logo: 'Y', color: 'blue', desc: "Türkiye'nin en geniş dağıtım ağına sahip kargo şirketi.", fields: { username: 'YK_User_123', password: '***', language: 'TR' }, permissions: { create_shipment: true, track_shipment: true, cancel_shipment: true, get_label: true }, advancedSettings: { label_format: { label: 'Barkod Formatı', value: 'PDF (A6 - Etiket)', type: 'select', options: ['PDF (A4)', 'PDF (A6 - Etiket)', 'ZPL (Zebra)'] }, payment_type: { label: 'Varsayılan Ödeme Tipi', value: 'Gönderici Ödemeli', type: 'select', options: ['Gönderici Ödemeli', 'Alıcı Ödemeli'] }, sms_notify: { label: 'Müşteriye SMS Bildirimi', value: true, type: 'toggle' } }, logs: [] },
  { id: 21, name: 'Aras Kargo', category: 'Lojistik', status: 'disconnected', logo: 'A', color: 'sky', desc: 'Teknolojik altyapısı güçlü kargo çözümleri.', fields: { username: '', password: '', customerId: '', integrationCode: '' }, permissions: { create_shipment: true, track_shipment: true }, advancedSettings: { branch_selection: { label: 'Çıkış Şubesi', value: 'Merkez Depo', type: 'input' }, cod_enabled: { label: 'Kapıda Ödeme (Tahsilatlı) Gönderim', value: false, type: 'toggle' } }, logs: [] },
  { id: 22, name: 'MNG Kargo', category: 'Lojistik', status: 'disconnected', logo: 'M', color: 'orange', desc: 'Global standartlarda taşımacılık.', fields: { username: '', password: '', apiKey: '' }, permissions: { create_shipment: true, track_shipment: true }, advancedSettings: { service_type: { label: 'Hizmet Türü', value: 'Standart', type: 'select', options: ['Standart', 'Gün İçi', 'Akşam Teslimat'] } }, logs: [] },
  { id: 23, name: 'HepsiJet', category: 'Lojistik', status: 'disconnected', logo: 'H', color: 'red', desc: 'E-ticaret odaklı hızlı teslimat.', fields: { apiKey: '', apiSecret: '', storeId: '' }, permissions: { create_shipment: true, track_shipment: true, return_management: true }, advancedSettings: { delivery_type: { label: 'Teslimat Tipi', value: 'Next Day', type: 'select', options: ['Today', 'Next Day'] } }, logs: [] },
  { id: 24, name: 'PTT Kargo', category: 'Lojistik', status: 'disconnected', logo: 'P', color: 'yellow', desc: 'Geniş erişim ağı ve ekonomik gönderim.', fields: { username: '', password: '', customerId: '' }, permissions: { create_shipment: true }, advancedSettings: { official_doc: { label: 'Resmi Evrak Gönderimi', value: false, type: 'toggle' } }, logs: [] },
  { id: 25, name: 'UPS', category: 'Lojistik', status: 'disconnected', logo: 'U', color: 'stone', desc: 'Uluslararası gönderim ve lojistik.', fields: { accessKey: '', userId: '', password: '', shipperNumber: '' }, permissions: { create_shipment: true, track_shipment: true, customs_docs: true }, advancedSettings: { intl_shipping: { label: 'Yurt Dışı Gönderim Modu', value: true, type: 'toggle' } }, logs: [] }
];

export const accountingData = [
  { id: 30, name: 'Paraşüt', category: 'Muhasebe', status: 'connected', logo: 'P', color: 'pink', desc: 'Online ön muhasebe ve e-fatura yönetimi.', fields: { clientId: 'client_id_xxxxx', clientSecret: 'client_secret_xxxxx', companyId: '12345', username: 'muhasebe@firma.com', password: '***' }, permissions: { invoices_create: true, invoices_read: true, contacts_create: true, products_read: true, collections_create: true }, advancedSettings: { auto_invoice: { label: 'Otomatik Fatura Oluştur', value: true, type: 'toggle' }, invoice_prefix: { label: 'Fatura Seri No (Ön Ek)', value: 'WEB-', type: 'input' }, vat_type: { label: 'KDV Hesaplama', value: 'Dahil', type: 'select', options: ['Dahil', 'Hariç'] }, due_days: { label: 'Vade Günü', value: '14 Gün', type: 'select', options: ['Peşin', '7 Gün', '14 Gün', '30 Gün'] } }, logs: [] },
  { id: 31, name: 'Logo İşbaşı', category: 'Muhasebe', status: 'disconnected', logo: 'L', color: 'green', desc: 'Mikro işletmeler için bulut muhasebe.', fields: { apiKey: '', tenantId: '' }, permissions: { invoices_create: true, contacts_create: true }, advancedSettings: { e_archive: { label: 'E-Arşiv Fatura Gönderimi', value: true, type: 'toggle' }, stock_deduct: { label: 'Faturadan Stok Düş', value: true, type: 'toggle' } }, logs: [] },
  { id: 32, name: 'Bizim Hesap', category: 'Muhasebe', status: 'disconnected', logo: 'B', color: 'blue', desc: 'KOBİ dostu pratik muhasebe.', fields: { apiKey: '' }, permissions: { invoices_create: true, collections_create: false }, advancedSettings: { category_match: { label: 'Kategori Eşleşmesi', value: 'Otomatik', type: 'select', options: ['Otomatik', 'Manuel'] } }, logs: [] },
  { id: 33, name: 'QuickBooks', category: 'Muhasebe', status: 'disconnected', logo: 'Q', color: 'emerald', desc: 'Dünya genelinde popüler finans yazılımı.', fields: { clientId: '', clientSecret: '', realmId: '' }, permissions: { invoices_create: true, expenses_read: true }, advancedSettings: { currency: { label: 'Raporlama Para Birimi', value: 'USD', type: 'select', options: ['USD', 'EUR', 'TRY'] } }, logs: [] }
];

export const paymentData = [
  { id: 40, name: 'Iyzico', category: 'Ödeme', status: 'connected', logo: 'iyz', color: 'indigo', desc: 'Kolay ve güvenli ödeme altyapısı.', fields: { apiKey: '', secretKey: '' }, demoTemplate: paymentDemoTemplateData[40], permissions: { payments: true, refunds: true, installments: true, saved_cards: false }, advancedSettings: { mode: { label: 'Çalışma Modu', value: 'Canlı (Live)', type: 'select', options: ['Canlı (Live)', 'Test (Sandbox)'] }, threed_secure: { label: '3D Secure Zorunlu', value: true, type: 'toggle' }, installment_limit: { label: 'Maksimum Taksit Sayısı', value: '12', type: 'select', options: ['Tek Çekim', '3', '6', '9', '12'] } }, logs: [] },
  { id: 41, name: 'PayTR', category: 'Ödeme', status: 'disconnected', logo: 'P', color: 'blue', desc: 'Sanal POS ve ödeme çözümleri.', fields: { merchantId: '', merchantKey: '', merchantSalt: '' }, permissions: { payments: true, refunds: true }, advancedSettings: { test_mode: { label: 'Test Modu', value: false, type: 'toggle' }, iframe_mode: { label: 'iFrame Ödeme Sayfası', value: true, type: 'toggle' } }, logs: [] },
  { id: 42, name: 'Stripe', category: 'Ödeme', status: 'disconnected', logo: 'S', color: 'purple', desc: 'Dünyanın ödeme altyapısı.', fields: { publishableKey: '', secretKey: '' }, permissions: { payments: true, refunds: true, payouts: false }, advancedSettings: { capture_method: { label: 'Ödeme Alma Yöntemi', value: 'Otomatik', type: 'select', options: ['Otomatik', 'Manuel Onay'] } }, logs: [] },
  { id: 43, name: 'PayPal', category: 'Ödeme', status: 'disconnected', logo: 'Pp', color: 'sky', desc: 'Global cüzdan ve ödeme.', fields: { clientId: '', clientSecret: '' }, permissions: { payments: true, refunds: true }, advancedSettings: { currency: { label: 'Varsayılan Para Birimi', value: 'USD', type: 'select', options: ['USD', 'EUR', 'GBP'] } }, logs: [] },
  { id: 44, name: 'Param', category: 'Ödeme', status: 'disconnected', logo: 'Pm', color: 'red', desc: 'Elektronik para kuruluşu.', fields: { clientCode: '', clientUsername: '', clientPassword: '' }, permissions: { payments: true }, logs: [] }
];
