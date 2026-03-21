import React from 'react';
import IntegrationCard from './IntegrationCard';

// --- E-TİCARET VERİLERİ (GELİŞMİŞ SHOPIFY & YERLİ DEVLER) ---
export const ecommerceData = [
  // 1. SHOPIFY (ULTIMATE ENTEGRASYON)
  { 
    id: 1, 
    name: 'Shopify', 
    category: 'E-Ticaret', 
    status: 'connected', 
    logo: 'S', 
    color: 'green', 
    desc: 'Global e-ticaret altyapısı (Full Entegrasyon).', 
    // Shopify'a özel bağlantı alanları
    fields: { 
      shopUrl: 'my-store.myshopify.com', 
      accessToken: 'shpat_8823xxxxxxxx', 
      apiSecret: 'shpss_xxxxxxxx' 
    },
    // Shopify İzinleri
    permissions: { 
      orders_read: true, 
      orders_write: true, 
      products_read: true, 
      products_write: true, 
      customers_read: true, 
      inventory_read: true, 
      inventory_write: true 
    },
    // Shopify'a Özel Gelişmiş Ayarlar (Mapping vb.)
    advancedSettings: {
      warehouse_selection: { label: 'Stok Düşülecek Depo (Location)', value: 'Main Warehouse (ID: 8821)', type: 'select', options: ['Main Warehouse (ID: 8821)', 'Istanbul Store (ID: 9921)', 'Ankara Hub (ID: 1120)'] },
      order_prefix: { label: 'Sipariş Numarası Ön eki', value: 'SP-', type: 'input' },
      sync_direction: { label: 'Stok Eşitleme Yönü', value: 'Panel -> Shopify', type: 'select', options: ['Panel -> Shopify', 'Shopify -> Panel', 'Çift Yönlü'] },
      status_mapping_paid: { label: 'Shopify "Paid" Durumu Karşılığı', value: 'Onaylandı', type: 'select', options: ['Onaylandı', 'Hazırlanıyor', 'Tamamlandı'] },
      webhooks_enabled: { label: 'Real-time Webhooks (Canlı Veri)', value: true, type: 'toggle' }
    },
    logs: [] 
  },

  // 2. İKAS (YENİ)
  { 
    id: 2, 
    name: 'İkas', 
    category: 'E-Ticaret', 
    status: 'disconnected', 
    logo: 'i', 
    color: 'indigo', 
    desc: 'Yeni nesil, hızlı e-ticaret altyapısı.', 
    fields: { 
      clientId: '', 
      clientSecret: '',
      storeId: ''
    }, 
    permissions: { orders: true, products: true, customers: true }, 
    advancedSettings: { 
      syncInterval: { label: 'Eşitleme Aralığı', value: '5 Dakika', type: 'select', options: ['1 Dakika', '5 Dakika', '15 Dakika', '1 Saat'] }
    },
    logs: [] 
  },

  // 3. TİCİMAX (YENİ)
  { 
    id: 3, 
    name: 'Ticimax', 
    category: 'E-Ticaret', 
    status: 'disconnected', 
    logo: 'T', 
    color: 'blue', 
    desc: 'Gelişmiş yerli e-ticaret çözümleri.', 
    fields: { 
      domain: 'www.sitem.com', 
      memberCode: '', 
      userCode: '', 
      password: '' 
    }, 
    permissions: { orders: true, products: true, members: false }, 
    advancedSettings: { 
      memberGroup: { label: 'Varsayılan Üye Grubu', value: 'Genel', type: 'input' },
      taxClass: { label: 'KDV Dahil/Hariç Gönderim', value: 'Dahil', type: 'select', options: ['Dahil', 'Hariç'] }
    },
    logs: [] 
  },

  // 4. WOOCOMMERCE
  { 
    id: 4, 
    name: 'WooCommerce', 
    category: 'E-Ticaret', 
    status: 'disconnected', 
    logo: 'W', 
    color: 'purple', 
    desc: 'WordPress tabanlı açık kaynak mağaza.', 
    fields: { 
      consumerKey: '', 
      consumerSecret: '', 
      url: '' 
    },
    permissions: { orders: true, products: true }, 
    logs: [] 
  },

  // 5. IDEASOFT
  { 
    id: 5, 
    name: 'Ideasoft', 
    category: 'E-Ticaret', 
    status: 'disconnected', 
    logo: 'I', 
    color: 'orange', 
    desc: 'Türkiye\'nin köklü e-ticaret altyapısı.', 
    fields: { 
      domain: '', 
      token: '' 
    },
    permissions: { orders: true }, 
    logs: [] 
  }
];

const EcommerceApps = ({ apps, onManage }) => {
  const filtered = apps.filter(a => a.category === 'E-Ticaret');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in slide-in-from-bottom-4 duration-500">
      {filtered.map(app => (
        <IntegrationCard key={app.id} app={app} onManage={onManage} />
      ))}
    </div>
  );
};

export default EcommerceApps;