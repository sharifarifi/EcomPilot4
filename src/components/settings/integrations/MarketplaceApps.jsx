import React from 'react';
import IntegrationCard from './IntegrationCard';
import { marketplaceDemoTemplateData } from './demoTemplateData/marketplaceDemoData';

// --- PAZARYERİ VERİLERİ ---
export const marketplaceData = [
  {
    id: 10, name: 'Trendyol', category: 'Pazaryeri', status: 'connected', logo: 'T', color: 'orange',
    desc: "Türkiye'nin lider pazaryeri.",
    fields: { supplierId: '', apiKey: '', apiSecret: '' },
    demoTemplate: marketplaceDemoTemplateData[10],
    permissions: { orders: true, stock_update: true, price_update: true, questions: true, returns: true },
    advancedSettings: { autoConfirm: 'Evet', autoInvoiceUpload: 'Evet', cargoProvider: 'Yurtiçi Kargo' },
    logs: []
  },
  {
    id: 11, name: 'Hepsiburada', category: 'Pazaryeri', status: 'disconnected', logo: 'H', color: 'orange',
    desc: 'Büyük e-ticaret platformu.',
    fields: { merchantId: '' },
    permissions: { orders: true, products: true, claims: false },
    logs: []
  },
  {
    id: 12, name: 'N11', category: 'Pazaryeri', status: 'disconnected', logo: 'N', color: 'red',
    desc: 'Hayat sana gelir.',
    fields: { apiKey: '', apiSecret: '' },
    permissions: { orders: true, products: true },
    logs: []
  },
  {
    id: 13, name: 'Amazon TR', category: 'Pazaryeri', status: 'disconnected', logo: 'A', color: 'yellow',
    desc: 'Dünyanın en büyük pazaryeri.',
    fields: { sellerId: '', mwsAuthToken: '' },
    permissions: { orders: true, inventory: true, buybox_tracking: false },
    logs: []
  },
  {
    id: 14, name: 'Çiçeksepeti', category: 'Pazaryeri', status: 'disconnected', logo: 'Ç', color: 'blue',
    desc: 'Hediye ve çiçek odaklı pazaryeri.',
    fields: { apiKey: '' },
    permissions: { orders: true },
    logs: []
  }
];

const MarketplaceApps = ({ apps, onManage }) => {
  const filtered = apps.filter(a => a.category === 'Pazaryeri');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in slide-in-from-bottom-4 duration-500">
      {filtered.map(app => <IntegrationCard key={app.id} app={app} onManage={onManage} />)}
    </div>
  );
};

export default MarketplaceApps;
