import React, { useState } from 'react';
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

  const handleExport = () => {
    alert("Finansal Rapor (XLSX) hazırlanıyor...");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* 1. HEADER AREA */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Finansal Kontrol Merkezi</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Nakit akışı, kârlılık ve bütçe analizi.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
           {/* Tab Menü */}
           <div className="flex bg-slate-100 p-1 rounded-xl">
              {['Genel Bakış', 'Nakit Akışı', 'Defter'].map((t, i) => {
                 const keys = ['overview', 'cashflow', 'ledger'];
                 return (
                    <button 
                      key={i} 
                      onClick={() => setActiveTab(keys[i])}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === keys[i] ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                       {t}
                    </button>
                 )
              })}
           </div>

           {/* Tarih Seçici */}
           <div className="relative group">
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 hover:border-slate-300 transition cursor-pointer min-w-[140px]"
              >
                 <option>Bu Ay</option><option>Bu Çeyrek</option><option>Bu Yıl</option>
              </select>
              <Calendar size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none"/>
              <ChevronDown size={16} className="absolute right-3.5 top-3 text-slate-400 pointer-events-none"/>
           </div>

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
         <FinanceCard 
            title="Toplam Gelir" value="₺845,230" subValue="₺1.2M Hedef" 
            change="+%12" trend="up" icon={TrendingUp} color="emerald" 
            target={78} loading={loading}
         />
         <FinanceCard 
            title="Operasyonel Gider" value="₺242,500" subValue="Limit: ₺300k"
            change="+%5" trend="down" icon={TrendingDown} color="rose" 
            target={80} loading={loading}
         />
         <FinanceCard 
            title="Net Kâr (EBITDA)" value="₺602,730" subValue="Marj: %71"
            change="+%18" trend="up" icon={Wallet} color="blue" 
            target={92} loading={loading}
         />
         <FinanceCard 
            title="Kasa Nakdi" value="₺128,400" subValue="Runway: 4 Ay"
            change="-%2" trend="down" icon={Landmark} color="amber" 
            target={45} loading={loading}
         />
      </div>

      {/* 3. ANA GRAFİK & DETAYLAR */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         
         {/* SOL: Composite Chart (Ciro vs Kâr) */}
         <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[450px]">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                     <Banknote size={20} className="text-blue-500"/> Finansal Trend Analizi
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

         {/* SAĞ: Gider Dağılımı (Daha Detaylı) */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[450px]">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <PieChart size={20} className="text-rose-500"/> Gider Analizi
               </h3>
               <button className="text-xs font-bold text-slate-400 hover:text-slate-600">Detaylar</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
               {[
                  { label: 'Ürün Maliyeti (COGS)', val: 45, money: '₺109k', col: 'bg-slate-800' },
                  { label: 'Dijital Pazarlama', val: 25, money: '₺60k', col: 'bg-rose-500' },
                  { label: 'Lojistik & Kargo', val: 15, money: '₺36k', col: 'bg-blue-500' },
                  { label: 'Personel Giderleri', val: 10, money: '₺24k', col: 'bg-emerald-500' },
                  { label: 'Altyapı & Yazılım', val: 5, money: '₺12k', col: 'bg-amber-500' }
               ].map((d, i) => (
                  <div key={i} className="group">
                     <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${d.col}`}></div>
                           <span className="text-sm font-bold text-slate-700">{d.label}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">{d.money}</span>
                     </div>
                     <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                        <div 
                           className={`h-full rounded-full ${d.col} transition-all duration-1000 relative`} 
                           style={{width: `${d.val}%`}}
                        ></div>
                     </div>
                  </div>
               ))}
            </div>
            
            <div className="mt-4 p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-3">
               <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600"><AlertCircle size={16}/></div>
               <div>
                  <p className="text-xs text-rose-800 font-bold mb-0.5">Bütçe Uyarısı</p>
                  <p className="text-[10px] text-rose-600 leading-snug">
                     Pazarlama giderleri öngörülen bütçeyi <strong>%15</strong> aştı. Kampanyaları optimize etmeniz önerilir.
                  </p>
               </div>
            </div>
         </div>

      </div>

      {/* 4. İŞLEM DEFTERİ (LEDGER) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <div>
               <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><CreditCard size={20} className="text-slate-500"/> Hesap Hareketleri</h3>
               <p className="text-xs text-slate-500">Son 30 günlük giriş/çıkış işlemleri.</p>
            </div>
            <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
               <input className="px-3 py-1.5 text-xs outline-none w-48" placeholder="İşlem ara... (ID, Açıklama)"/>
               <button className="px-3 py-1.5 border-l border-slate-100 text-slate-400 hover:text-slate-600"><Filter size={14}/></button>
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
                  {transactions.map((t, i) => (
                     <tr key={i} className="hover:bg-slate-50 transition-colors group">
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
                              {t.status === 'Tamamlandı' ? <CheckCircle size={10}/> : <Clock size={10}/>} {t.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="text-slate-400 hover:text-blue-600 transition p-2 rounded-full hover:bg-blue-50">
                              <FileText size={16}/>
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

    </div>
  );
};

export default FinanceReport;