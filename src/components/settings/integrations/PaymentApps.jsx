import React from 'react';
import IntegrationCard from './IntegrationCard';
import { paymentDemoTemplateData } from './demoTemplateData/paymentDemoData';

// --- ÖDEME SİSTEMLERİ VERİLERİ ---
export const paymentData = [
  // 1. IYZICO (Türkiye Lideri)
  {
    id: 40,
    name: 'Iyzico',
    category: 'Ödeme',
    status: 'connected',
    logo: 'iyz', // Logo metin tabanlı simülasyon
    color: 'indigo',
    desc: 'Kolay ve güvenli ödeme altyapısı.',
    fields: {
      apiKey: '',
      secretKey: ''
    },
    demoTemplate: paymentDemoTemplateData[40],
    permissions: {
      payments: true,
      refunds: true, // İade yetkisi
      installments: true, // Taksit sorgulama
      saved_cards: false // Kart saklama
    },
    advancedSettings: {
      mode: { label: 'Çalışma Modu', value: 'Canlı (Live)', type: 'select', options: ['Canlı (Live)', 'Test (Sandbox)'] },
      threed_secure: { label: '3D Secure Zorunlu', value: true, type: 'toggle' },
      installment_limit: { label: 'Maksimum Taksit Sayısı', value: '12', type: 'select', options: ['Tek Çekim', '3', '6', '9', '12'] }
    },
    logs: []
  },

  // 2. PAYTR (Popüler Alternatif)
  {
    id: 41,
    name: 'PayTR',
    category: 'Ödeme',
    status: 'disconnected',
    logo: 'P',
    color: 'blue',
    desc: 'Sanal POS ve ödeme çözümleri.',
    fields: {
      merchantId: '',
      merchantKey: '',
      merchantSalt: ''
    },
    permissions: { payments: true, refunds: true },
    advancedSettings: {
      test_mode: { label: 'Test Modu', value: false, type: 'toggle' },
      iframe_mode: { label: 'iFrame Ödeme Sayfası', value: true, type: 'toggle' }
    },
    logs: []
  },

  // 3. STRIPE (Global)
  {
    id: 42,
    name: 'Stripe',
    category: 'Ödeme',
    status: 'disconnected',
    logo: 'S',
    color: 'purple',
    desc: 'Dünyanın ödeme altyapısı.',
    fields: {
      publishableKey: '',
      secretKey: ''
    },
    permissions: { payments: true, refunds: true, payouts: false },
    advancedSettings: {
      capture_method: { label: 'Ödeme Alma Yöntemi', value: 'Otomatik', type: 'select', options: ['Otomatik', 'Manuel Onay'] }
    },
    logs: []
  },

  // 4. PAYPAL (Yurt Dışı Satışlar İçin)
  {
    id: 43,
    name: 'PayPal',
    category: 'Ödeme',
    status: 'disconnected',
    logo: 'Pp',
    color: 'sky',
    desc: 'Global cüzdan ve ödeme.',
    fields: {
      clientId: '',
      clientSecret: ''
    },
    permissions: { payments: true, refunds: true },
    advancedSettings: {
      currency: { label: 'Varsayılan Para Birimi', value: 'USD', type: 'select', options: ['USD', 'EUR', 'GBP'] }
    },
    logs: []
  },

  // 5. PARAM / SİPAY
  {
    id: 44,
    name: 'Param',
    category: 'Ödeme',
    status: 'disconnected',
    logo: 'Pm',
    color: 'red',
    desc: 'Elektronik para kuruluşu.',
    fields: {
      clientCode: '',
      clientUsername: '',
      clientPassword: ''
    },
    permissions: { payments: true },
    logs: []
  }
];

const PaymentApps = ({ apps, onManage }) => {
  const filtered = apps.filter(a => a.category === 'Ödeme');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in slide-in-from-bottom-4 duration-500">
      {filtered.map(app => (
        <IntegrationCard key={app.id} app={app} onManage={onManage} />
      ))}
    </div>
  );
};

export default PaymentApps;
