import React from 'react';
import { CheckCircle, Clock, CreditCard, FileText, Filter } from 'lucide-react';

const TransactionLedger = ({ transactions }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
      <div>
        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><CreditCard size={20} className="text-slate-500" /> Hesap Hareketleri</h3>
        <p className="text-xs text-slate-500">Son 30 günlük giriş/çıkış işlemleri.</p>
      </div>
      <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
        <input className="px-3 py-1.5 text-xs outline-none w-48" placeholder="İşlem ara... (ID, Açıklama)" />
        <button className="px-3 py-1.5 border-l border-slate-100 text-slate-400 hover:text-slate-600"><Filter size={14} /></button>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">İşlem Kodu</th>
            <th className="px-6 py-4">Açıklama</th>
            <th className="px-6 py-4">Kategori</th>
            <th className="px-6 py-4">Tarih</th>
            <th className="px-6 py-4 text-right">Tutar</th>
            <th className="px-6 py-4 text-right">Durum</th>
            <th className="px-6 py-4 text-right">Belge</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
              <td className="px-6 py-4 font-mono text-xs text-slate-400 font-bold">{t.id}</td>
              <td className="px-6 py-4">
                <div className="font-bold text-slate-700">{t.desc}</div>
                <div className="text-[10px] text-slate-400 group-hover:text-blue-500 transition-colors cursor-pointer">Detayları Gör</div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 shadow-sm">
                  {t.cat}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-500 text-xs font-medium">{t.date}</td>
              <td className={`px-6 py-4 text-right font-black text-sm ${t.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {t.type === 'in' ? '+' : ''}{t.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </td>
              <td className="px-6 py-4 text-right">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === 'Tamamlandı' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                  {t.status === 'Tamamlandı' ? <CheckCircle size={10} /> : <Clock size={10} />} {t.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-slate-400 hover:text-blue-600 transition p-2 rounded-full hover:bg-blue-50">
                  <FileText size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TransactionLedger;
