import React from 'react';
import { AlertCircle, PieChart } from 'lucide-react';
import { EXPENSE_BREAKDOWN } from './constants';

const ExpenseBreakdownPanel = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[450px]">
    <div className="flex justify-between items-center mb-6">
      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
        <PieChart size={20} className="text-rose-500" /> Gider Analizi
      </h3>
      <button className="text-xs font-bold text-slate-400 hover:text-slate-600">Detaylar</button>
    </div>

    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
      {EXPENSE_BREAKDOWN.map((d) => (
        <div key={d.label} className="group">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${d.col}`}></div>
              <span className="text-sm font-bold text-slate-700">{d.label}</span>
            </div>
            <span className="text-xs font-bold text-slate-800">{d.money}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
            <div className={`h-full rounded-full ${d.col} transition-all duration-1000 relative`} style={{ width: `${d.val}%` }}></div>
          </div>
        </div>
      ))}
    </div>

    <div className="mt-4 p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-3">
      <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600"><AlertCircle size={16} /></div>
      <div>
        <p className="text-xs text-rose-800 font-bold mb-0.5">Bütçe Uyarısı</p>
        <p className="text-[10px] text-rose-600 leading-snug">
          Pazarlama giderleri öngörülen bütçeyi <strong>%15</strong> aştı. Kampanyaları optimize etmeniz önerilir.
        </p>
      </div>
    </div>
  </div>
);

export default ExpenseBreakdownPanel;
