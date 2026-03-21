import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

const FinanceCard = ({ title, value, subValue, change, trend, icon, color, loading, target }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden h-full flex flex-col justify-between">
    {loading ? (
      <div className="animate-pulse space-y-3">
        <div className="flex justify-between"><div className="h-10 w-10 bg-slate-100 rounded-xl"></div><div className="h-6 w-20 bg-slate-100 rounded-lg"></div></div>
        <div className="h-8 bg-slate-100 rounded w-3/4 mt-4"></div>
        <div className="h-4 bg-slate-100 rounded w-1/2"></div>
      </div>
    ) : (
      <>
        <div className="flex justify-between items-start mb-2 relative z-10">
          <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 border border-${color}-100 transition-transform group-hover:scale-110`}>
            {React.createElement(icon, { size: 22 })}
          </div>
          <div className="text-right">
            <span className={`flex items-center justify-end gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {change}
            </span>
            <span className="text-[10px] text-slate-400">vs geçen ay</span>
          </div>
        </div>

        <div className="relative z-10 mt-2">
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-xs text-slate-400 mt-1">{subValue}</p>
        </div>

        <div className="mt-5 relative z-10">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
            <span>Bütçe Gerçekleşmesi</span>
            <span className={target >= 100 ? 'text-emerald-600' : 'text-slate-600'}>%{target}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full bg-${color}-500 transition-all duration-1000`} style={{ width: `${Math.min(target, 100)}%` }}></div>
          </div>
        </div>

        <div className={`absolute -bottom-6 -right-6 p-4 opacity-[0.03] text-${color}-900 transform rotate-12 scale-150 pointer-events-none`}>
          {React.createElement(icon, { size: 120 })}
        </div>
      </>
    )}
  </div>
);

export default FinanceCard;
