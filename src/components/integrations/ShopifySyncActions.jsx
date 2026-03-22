import React from 'react';
import { Activity, Package, RefreshCcw, ShoppingBag, Wifi } from 'lucide-react';

const actionBaseClassName = 'flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed';

const ShopifySyncActions = ({
  disabled = false,
  isConnected = false,
  onConnect,
  onRefreshConnection,
  onStartInitialSync,
  onSyncOrders,
  onSyncProducts
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Shopify Aksiyonları</h3>
        <p className="text-sm text-slate-500 mt-1">Bağlantı ve senkronizasyon butonlarını mevcut UI içinde tekrar kullanılabilir şekilde sunar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <button onClick={onConnect} disabled={disabled || isConnected} className={`${actionBaseClassName} bg-blue-600 text-white hover:bg-blue-700`} type="button">
          <Wifi size={16} /> Connect with Shopify
        </button>
        <button onClick={onRefreshConnection} disabled={disabled || !isConnected} className={`${actionBaseClassName} bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`} type="button">
          <RefreshCcw size={16} /> Refresh Connection
        </button>
        <button onClick={onStartInitialSync} disabled={disabled || !isConnected} className={`${actionBaseClassName} bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`} type="button">
          <Activity size={16} /> Start Initial Sync
        </button>
        <button onClick={onSyncOrders} disabled={disabled || !isConnected} className={`${actionBaseClassName} bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`} type="button">
          <ShoppingBag size={16} /> Sync Orders
        </button>
        <button onClick={onSyncProducts} disabled={disabled || !isConnected} className={`${actionBaseClassName} bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`} type="button">
          <Package size={16} /> Sync Products
        </button>
      </div>
    </div>
  );
};

export default ShopifySyncActions;
