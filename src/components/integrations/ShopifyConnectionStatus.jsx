import React from 'react';
import { Wifi, WifiOff, ShieldAlert } from 'lucide-react';

const ShopifyConnectionStatus = ({ store, isLoading = false }) => {
  const isConnected = Boolean(store?.connected || store?.connectionState === 'connected');
  const grantedScopes = Array.isArray(store?.grantedScopes) ? store.grantedScopes : [];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Shopify Bağlantı Durumu</h3>
          <p className="text-sm text-slate-500 mt-1">Firestore üzerinden gelen mağaza metadata durum özeti.</p>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${isConnected ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isConnected ? 'Bağlı' : 'Bağlı Değil'}
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-400 italic">Bağlantı durumu yükleniyor...</div>
      ) : store ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold text-slate-500 uppercase">Mağaza</div>
            <div className="mt-1 font-semibold text-slate-800">{store.shopDomain || store.id}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold text-slate-500 uppercase">Bağlantı State</div>
            <div className="mt-1 font-semibold text-slate-800">{store.connectionState || 'unknown'}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold text-slate-500 uppercase">Son Güncelleme</div>
            <div className="mt-1 font-semibold text-slate-800">{store.updatedAt || store.authCodeReceivedAt || '—'}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold text-slate-500 uppercase">Son Hata</div>
            <div className="mt-1 font-semibold text-slate-800">{store.lastError || 'Yok'}</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <ShieldAlert size={18} />
          Bu mağaza için Firestore tarafında henüz bağlantı metadata kaydı bulunamadı.
        </div>
      )}

      {grantedScopes.length > 0 && (
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase mb-2">Granted Scopes</div>
          <div className="flex flex-wrap gap-2">
            {grantedScopes.map((scope) => (
              <span key={scope} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
                {scope}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopifyConnectionStatus;
