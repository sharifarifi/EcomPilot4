import React from 'react';
import IntegrationCard from './IntegrationCard';

// --- MUHASEBE VERİLERİ ---
export const accountingData = [
  // 1. PARAŞÜT (Türkiye Lideri)
  { 
    id: 30, 
    name: 'Paraşüt', 
    category: 'Muhasebe', 
    status: 'connected', 
    logo: 'P', 
    color: 'pink', 
    desc: 'Online ön muhasebe ve e-fatura yönetimi.', 
    fields: { 
      clientId: 'client_id_xxxxx', 
      clientSecret: 'client_secret_xxxxx', 
      companyId: '12345',
      username: 'muhasebe@firma.com',
      password: '***'
    },
    permissions: { 
      invoices_create: true, // Fatura oluşturma
      invoices_read: true, 
      contacts_create: true, // Cari oluşturma
      products_read: true,
      collections_create: true // Tahsilat ekleme
    }, 
    advancedSettings: { 
      auto_invoice: { label: 'Otomatik Fatura Oluştur', value: true, type: 'toggle' },
      invoice_prefix: { label: 'Fatura Seri No (Ön Ek)', value: 'WEB-', type: 'input' },
      vat_type: { label: 'KDV Hesaplama', value: 'Dahil', type: 'select', options: ['Dahil', 'Hariç'] },
      due_days: { label: 'Vade Günü', value: '14 Gün', type: 'select', options: ['Peşin', '7 Gün', '14 Gün', '30 Gün'] }
    },
    logs: [] 
  },

  // 2. LOGO İŞBAŞI
  { 
    id: 31, 
    name: 'Logo İşbaşı', 
    category: 'Muhasebe', 
    status: 'disconnected', 
    logo: 'L', 
    color: 'green', 
    desc: 'Mikro işletmeler için bulut muhasebe.', 
    fields: { 
      apiKey: '', 
      tenantId: '' 
    },
    permissions: { invoices_create: true, contacts_create: true }, 
    advancedSettings: { 
      e_archive: { label: 'E-Arşiv Fatura Gönderimi', value: true, type: 'toggle' },
      stock_deduct: { label: 'Faturadan Stok Düş', value: true, type: 'toggle' }
    },
    logs: [] 
  },

  // 3. BİZİM HESAP
  { 
    id: 32, 
    name: 'Bizim Hesap', 
    category: 'Muhasebe', 
    status: 'disconnected', 
    logo: 'B', 
    color: 'blue', 
    desc: 'KOBİ dostu pratik muhasebe.', 
    fields: { 
      apiKey: '' 
    },
    permissions: { invoices_create: true, collections_create: false }, 
    advancedSettings: { 
      category_match: { label: 'Kategori Eşleşmesi', value: 'Otomatik', type: 'select', options: ['Otomatik', 'Manuel'] }
    },
    logs: [] 
  },

  // 4. QUICKBOOKS (Global)
  { 
    id: 33, 
    name: 'QuickBooks', 
    category: 'Muhasebe', 
    status: 'disconnected', 
    logo: 'Q', 
    color: 'emerald', 
    desc: 'Dünya genelinde popüler finans yazılımı.', 
    fields: { 
      clientId: '', 
      clientSecret: '',
      realmId: ''
    },
    permissions: { invoices_create: true, expenses_read: true }, 
    advancedSettings: { 
      currency: { label: 'Raporlama Para Birimi', value: 'USD', type: 'select', options: ['USD', 'EUR', 'TRY'] }
    },
    logs: [] 
  }
];

const AccountingApps = ({ apps, onManage }) => {
  const filtered = apps.filter(a => a.category === 'Muhasebe');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in slide-in-from-bottom-4 duration-500">
      {filtered.map(app => (
        <IntegrationCard key={app.id} app={app} onManage={onManage} />
      ))}
    </div>
  );
};

export default AccountingApps;