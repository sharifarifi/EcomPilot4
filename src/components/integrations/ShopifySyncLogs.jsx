import React from 'react';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';

const ShopifySyncLogs = ({ logs = [], isLoading = false, emptyMessage = 'Henüz Shopify log kaydı yok.' }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-blue-500" />
        <h3 className="text-lg font-bold text-slate-800">Shopify Senkronizasyon Logları</h3>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-400 italic">Loglar yükleniyor...</div>
      ) : logs.length > 0 ? (
        <div className="space-y-3">
          {logs.map((log) => {
            const isError = log.routeStatus === 'failed' || log.status === 'error';

            return (
              <div key={log.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-start gap-3 min-w-0">
                  {isError ? <AlertCircle size={16} className="text-red-500 mt-0.5" /> : <CheckCircle size={16} className="text-green-500 mt-0.5" />}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 break-words">{log.topic || 'unknown'}</div>
                    <div className="text-xs text-slate-500 mt-1 break-words">{log.note || 'Detay mesajı yok.'}</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono whitespace-nowrap">{log.receivedAt || log.createdAt || '—'}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-slate-400 italic">{emptyMessage}</div>
      )}
    </div>
  );
};

export default ShopifySyncLogs;
