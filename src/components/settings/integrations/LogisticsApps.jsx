import React from 'react';
import IntegrationCard from './IntegrationCard';

// --- LOJİSTİK VERİLERİ (KARGO FİRMALARI) ---
export const logisticsData = [
  // 1. YURTİÇİ KARGO
  { 
    id: 20, 
    name: 'Yurtiçi Kargo', 
    category: 'Lojistik', 
    status: 'connected', 
    logo: 'Y', 
    color: 'blue', 
    desc: 'Türkiye\'nin en geniş dağıtım ağına sahip kargo şirketi.', 
    fields: { 
      username: 'YK_User_123', 
      password: '***', 
      language: 'TR' 
    }, 
    permissions: { 
      create_shipment: true, 
      track_shipment: true, 
      cancel_shipment: true, 
      get_label: true 
    }, 
    advancedSettings: { 
      label_format: { label: 'Barkod Formatı', value: 'PDF (A6 - Etiket)', type: 'select', options: ['PDF (A4)', 'PDF (A6 - Etiket)', 'ZPL (Zebra)'] },
      payment_type: { label: 'Varsayılan Ödeme Tipi', value: 'Gönderici Ödemeli', type: 'select', options: ['Gönderici Ödemeli', 'Alıcı Ödemeli'] },
      sms_notify: { label: 'Müşteriye SMS Bildirimi', value: true, type: 'toggle' }
    },
    logs: [] 
  },

  // 2. ARAS KARGO
  { 
    id: 21, 
    name: 'Aras Kargo', 
    category: 'Lojistik', 
    status: 'disconnected', 
    logo: 'A', 
    color: 'sky', 
    desc: 'Teknolojik altyapısı güçlü kargo çözümleri.', 
    fields: { 
      username: '', 
      password: '', 
      customerId: '',
      integrationCode: ''
    }, 
    permissions: { create_shipment: true, track_shipment: true }, 
    advancedSettings: { 
      branch_selection: { label: 'Çıkış Şubesi', value: 'Merkez Depo', type: 'input' },
      cod_enabled: { label: 'Kapıda Ödeme (Tahsilatlı) Gönderim', value: false, type: 'toggle' }
    },
    logs: [] 
  },

  // 3. MNG KARGO
  { 
    id: 22, 
    name: 'MNG Kargo', 
    category: 'Lojistik', 
    status: 'disconnected', 
    logo: 'M', 
    color: 'orange', 
    desc: 'Global standartlarda taşımacılık.', 
    fields: { 
      username: '', 
      password: '',
      apiKey: '' 
    }, 
    permissions: { create_shipment: true, track_shipment: true }, 
    advancedSettings: { 
      service_type: { label: 'Hizmet Türü', value: 'Standart', type: 'select', options: ['Standart', 'Gün İçi', 'Akşam Teslimat'] }
    },
    logs: [] 
  },

  // 4. HEPSİJET
  { 
    id: 23, 
    name: 'HepsiJet', 
    category: 'Lojistik', 
    status: 'disconnected', 
    logo: 'H', 
    color: 'red', 
    desc: 'E-ticaret odaklı hızlı teslimat.', 
    fields: { 
      apiKey: '', 
      apiSecret: '', 
      storeId: '' 
    }, 
    permissions: { create_shipment: true, track_shipment: true, return_management: true }, 
    advancedSettings: { 
      delivery_type: { label: 'Teslimat Tipi', value: 'Next Day', type: 'select', options: ['Today', 'Next Day'] }
    },
    logs: [] 
  },

  // 5. PTT KARGO
  { 
    id: 24, 
    name: 'PTT Kargo', 
    category: 'Lojistik', 
    status: 'disconnected', 
    logo: 'P', 
    color: 'yellow', 
    desc: 'Geniş erişim ağı ve ekonomik gönderim.', 
    fields: { 
      username: '', 
      password: '', 
      customerId: '' 
    }, 
    permissions: { create_shipment: true }, 
    advancedSettings: { 
      official_doc: { label: 'Resmi Evrak Gönderimi', value: false, type: 'toggle' }
    },
    logs: [] 
  },

  // 6. UPS TÜRKİYE
  { 
    id: 25, 
    name: 'UPS', 
    category: 'Lojistik', 
    status: 'disconnected', 
    logo: 'U', 
    color: 'stone', 
    desc: 'Uluslararası gönderim ve lojistik.', 
    fields: { 
      accessKey: '', 
      userId: '', 
      password: '',
      shipperNumber: ''
    }, 
    permissions: { create_shipment: true, track_shipment: true, customs_docs: true }, 
    advancedSettings: { 
      intl_shipping: { label: 'Yurt Dışı Gönderim Modu', value: true, type: 'toggle' }
    },
    logs: [] 
  }
];

const LogisticsApps = ({ apps, onManage }) => {
  const filtered = apps.filter(a => a.category === 'Lojistik');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in slide-in-from-bottom-4 duration-500">
      {filtered.map(app => (
        <IntegrationCard key={app.id} app={app} onManage={onManage} />
      ))}
    </div>
  );
};

export default LogisticsApps;