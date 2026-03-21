import React from 'react';
import { Banknote } from 'lucide-react';
import CompositeChart from './finance-report/CompositeChart';
import ExpenseBreakdownPanel from './finance-report/ExpenseBreakdownPanel';
import FinanceKpiGrid from './finance-report/FinanceKpiGrid';
import FinanceReportHeader from './finance-report/FinanceReportHeader';
import TransactionLedger from './finance-report/TransactionLedger';
import { useFinanceReportViewModel } from './finance-report/useFinanceReportViewModel';

const FinanceReport = () => {
  const {
    activeTab,
    dateRange,
    financialData,
    handleExport,
    loading,
    setActiveTab,
    setDateRange,
    transactions,
  } = useFinanceReportViewModel();

const FinanceReport = () => {
  const {
    activeTab,
    dateRange,
    financialData,
    handleExport,
    loading,
    setActiveTab,
    setDateRange,
    transactions,
  } = useFinanceReportViewModel();
import React, { useState } from 'react';
import React, { useMemo, useState } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, 
  Download, ChevronDown, PieChart, ArrowUpRight, ArrowDownRight,
  FileText, Filter, CreditCard, Banknote, Landmark, Target,
  Percent, ArrowRight, Printer, Share2, CheckCircle, Clock, AlertCircle // <-- EKLENEN İKONLAR
} from 'lucide-react';
import { financeReportFinancialData, financeReportTransactions } from '../../demo-data/financeReport';

// --- YARDIMCI BİLEŞENLER ---

// 1. Premium Finans Kartı
const FinanceCard = ({ title, value, subValue, change, trend, icon, color, loading, target }) => (
const FinanceCard = ({ title, value, subValue, change, trend, icon, color, loading, target }) => {
  const Icon = icon;

  return (
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
                 {trend === 'up' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {change}
              </span>
              <span className="text-[10px] text-slate-400">vs geçen ay</span>
           </div>
        </div>
        
        <div className="relative z-10 mt-2">
           <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
           <p className="text-sm font-medium text-slate-500">{title}</p>
           <p className="text-xs text-slate-400 mt-1">{subValue}</p>
           {subValue && <p className="text-xs font-semibold text-slate-400 mt-1">{subValue}</p>}
        </div>

        {/* Bütçe Hedef Barı */}
        <div className="mt-5 relative z-10">
           <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
              <span>Bütçe Gerçekleşmesi</span>
              <span className={target >= 100 ? 'text-emerald-600' : 'text-slate-600'}>%{target}</span>
           </div>
           <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-${color}-500 transition-all duration-1000`} style={{width: `${Math.min(target, 100)}%`}}></div>
           </div>
        </div>

        {/* Arkaplan İkonu */}
        <div className={`absolute -bottom-6 -right-6 p-4 opacity-[0.03] text-${color}-900 transform rotate-12 scale-150 pointer-events-none`}>
           {React.createElement(icon, { size: 120 })}
        </div>
      </>
    )}
  </div>
);
};

// 2. Hibrit Grafik (Bar + Line - SVG)
const CompositeChart = ({ data, loading }) => {
   if (!data || data.length === 0) return null;
   const maxVal = Math.max(...data.map(d => d.revenue)) * 1.2;
   
   return (
      <div className="relative h-72 w-full select-none">
         {loading && <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}
         
         <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
               <line key={i} x1="0" y1={tick * 100 + "%"} x2="100%" y2={tick * 100 + "%"} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4"/>
            ))}

            {/* Bars (Revenue) */}
            <g className="transform scale-y-[-1] origin-bottom translate-y-[100%]">
               {data.map((d, i) => {
                  const barHeight = (d.revenue / maxVal) * 100;
                  const xPos = (i / data.length) * 100;
                  const width = (100 / data.length) * 0.5;
                  return (
                     <rect 
                        key={i} x={`${xPos + (width/2)}%`} y="0" width={`${width}%`} height={`${barHeight}%`} rx="4"
                        className="fill-blue-500 hover:fill-blue-600 transition-all duration-500 cursor-pointer"
                     >
                        <title>Ciro: ₺{d.revenue}</title>
                     </rect>
                  )
               })}
            </g>

            {/* Line (Profit Margin - Orange) */}
            <polyline 
               fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
               points={data.map((d, i) => {
                  const x = (i / data.length) * 100 + ((100/data.length)*0.75); 
                  const y = 100 - ((d.profit / (maxVal * 0.4)) * 100); 
                  return `${x},${y}`;
               }).join(' ')}
               className="drop-shadow-md"
            />
            
            {/* Line Points */}
            {data.map((d, i) => {
               const x = (i / data.length) * 100 + ((100/data.length)*0.75);
               const y = 100 - ((d.profit / (maxVal * 0.4)) * 100);
               return (
                  <circle key={i} cx={`${x}%`} cy={`${y}%`} r="3" className="fill-white stroke-orange-500 stroke-2 hover:r-5 transition-all cursor-pointer">
                     <title>Kâr: ₺{d.profit}</title>
                  </circle>
               )
            })}
         </svg>

         {/* X-Axis */}
         <div className="flex justify-between mt-3 px-2">
            {data.map((d, i) => (
               <span key={i} className="text-[10px] font-bold text-slate-400 w-full text-center">{d.label}</span>
            ))}
         </div>
      </div>
   )
};

// --- ANA BİLEŞEN ---
const FinanceReport = () => {
  const [dateRange, setDateRange] = useState('Bu Yıl');
  const [activeTab, setActiveTab] = useState('overview'); 

  const financialData = financeReportFinancialData;
  const transactions = financeReportTransactions;

  const loading = false;
  const transactions = [
    { id: 'TX-9921', desc: 'Shopify Satış Geliri', cat: 'Satış', date: 'Bugün, 14:30', amount: 12450, type: 'in', status: 'Tamamlandı' },
    { id: 'TX-9920', desc: 'Meta Ads Reklam', cat: 'Pazarlama', date: 'Bugün, 11:00', amount: -4200, type: 'out', status: 'Tamamlandı' },
    { id: 'TX-9919', desc: 'Yurtiçi Kargo', cat: 'Lojistik', date: 'Dün, 16:45', amount: -1850, type: 'out', status: 'Bekliyor' },
    { id: 'TX-9918', desc: 'Trendyol Hakediş', cat: 'Satış', date: 'Dün, 09:15', amount: 8900, type: 'in', status: 'Tamamlandı' },
    { id: 'TX-9917', desc: 'AWS Sunucu', cat: 'Altyapı', date: '20 Mar', amount: -450, type: 'out', status: 'Tamamlandı' },
  ];

  const loading = false;

  const loading = false;

  const summaryCards = useMemo(() => ([
    { title: 'Toplam Gelir', value: '₺845,230', subValue: '₺1.2M Hedef', change: '+%12', trend: 'up', icon: TrendingUp, color: 'emerald', target: 78 },
    { title: 'Operasyonel Gider', value: '₺242,500', subValue: 'Limit: ₺300k', change: '+%5', trend: 'down', icon: TrendingDown, color: 'rose', target: 80 },
    { title: 'Net Kâr (EBITDA)', value: '₺602,730', subValue: 'Marj: %71', change: '+%18', trend: 'up', icon: Wallet, color: 'blue', target: 92 },
    { title: 'Kasa Nakdi', value: '₺128,400', subValue: 'Runway: 4 Ay', change: '-%2', trend: 'down', icon: Landmark, color: 'amber', target: 45 }
  ]), []);

  const handleExport = () => {
    alert("Finansal Rapor (XLSX) hazırlanıyor...");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <FinanceReportHeader
        activeTab={activeTab}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExport={handleExport}
        onTabChange={setActiveTab}
      />

      <FinanceKpiGrid loading={loading} />

           {/* Aksiyonlar */}
           <div className="flex gap-2">
              <button className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-100 transition" title="Yazdır">
                 <Printer size={18}/>
              </button>
              <button onClick={handleExport} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200">
                 <Download size={16}/> <span className="hidden sm:inline">İndir</span>
              </button>
           </div>
        </div>
      </div>

      {/* 2. KPI KARTLARI (Bütçe Hedefli) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
         {summaryCards.map((card) => (
           <FinanceCard key={card.title} {...card} loading={loading} />
         ))}
      </div>

      {/* 3. ANA GRAFİK & DETAYLAR */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Banknote size={20} className="text-blue-500" /> Finansal Trend Analizi
              </h3>
              <p className="text-xs text-slate-400 mt-1">Ciro ve net kârlılık korelasyonu.</p>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-600"><div className="w-3 h-3 rounded bg-blue-500"></div> Ciro (Bar)</span>
              <span className="flex items-center gap-2 text-xs font-bold text-slate-600"><div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white shadow-sm"></div> Net Kâr (Çizgi)</span>
            </div>
          </div>

          <div className="flex-1 relative w-full px-2 pb-2">
            <CompositeChart data={financialData} loading={loading} />
          </div>
        </div>

        <ExpenseBreakdownPanel />
      </div>

      <TransactionLedger transactions={transactions} />
    </div>
  );
};

export default FinanceReport;
