import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Download, Calendar, 
  PieChart as PieChartIcon, BarChart3, Layers, ShoppingCart, 
  Tag, Filter, AlertCircle, AlertTriangle, ArrowRight, Zap, Target, Box, CreditCard,
  Percent, Link, CheckCircle2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, PieChart, Pie, Cell, AreaChart, Area, ReferenceLine
} from 'recharts';

// --- 1. FİNANSAL KARLILIK VERİLERİ (COGS & MARGIN) ---
const financeTrendData = [
  { month: 'Eki', ciro: 450000, maliyet: 380000, netKar: 70000 },
  { month: 'Kas', ciro: 850000, maliyet: 720000, netKar: 130000 },
  { month: 'Ara', ciro: 620000, maliyet: 500000, netKar: 120000 },
  { month: 'Oca', ciro: 520000, maliyet: 410000, netKar: 110000 },
  { month: 'Şub', ciro: 480000, maliyet: 370000, netKar: 110000 },
  { month: 'Mar', ciro: 580000, maliyet: 440000, netKar: 140000 },
];

const costBreakdownData = [
  { name: 'Ürün Maliyeti (SMM)', value: 45, color: '#94A3B8' }, 
  { name: 'Pazaryeri Komisyonu', value: 18, color: '#F59E0B' }, 
  { name: 'Kargo & Lojistik', value: 12, color: '#3B82F6' }, 
  { name: 'Reklam (ROAS)', value: 10, color: '#A855F7' }, 
  { name: 'Net Kar Marjı', value: 15, color: '#10B981' }, 
];

const topProfitableProducts = [
  { sku: 'ELB-001', name: 'Siyah Abiye Elbise', ciro: 85000, kar: 38000, marj: 44.7 },
  { sku: 'AYK-022', name: 'Deri Loafer Ayakkabı', ciro: 62000, kar: 24000, marj: 38.7 },
  { sku: 'AKS-005', name: 'Güneş Gözlüğü', ciro: 25000, kar: 16000, marj: 64.0 }, 
];

const topLossMakers = [
  { sku: 'TSH-099', name: 'Promosyon Basic Tişört', ciro: 45000, kar: -2500, marj: -5.5, reason: 'Yüksek İade + Kargo' },
  { sku: 'EVC-012', name: 'Seramik Vazo (Kırılgan)', ciro: 18000, kar: -4200, marj: -23.3, reason: 'Kargo Hasarı' },
];

// --- 2. ABC ANALİZİ VERİLERİ (PARETO) ---
const abcDistributionData = [
  { name: 'A Grubu', ciroKatkisi: 80, urunOrani: 20, fill: '#10B981' },
  { name: 'B Grubu', ciroKatkisi: 15, urunOrani: 30, fill: '#3B82F6' },
  { name: 'C Grubu', ciroKatkisi: 5, urunOrani: 50, fill: '#EF4444' }, 
];

const cGroupLiquidationList = [
  { sku: 'MNT-04', name: 'Sarı Şişme Mont (Eski Sezon)', stok: 245, bagliSermaye: 49000, aylar: 8 },
  { sku: 'TSH-42', name: 'Neon Pembe Crop', stok: 180, bagliSermaye: 12600, aylar: 6 },
  { sku: 'AYK-11', name: 'Süet Bot (44 Numara)', stok: 85, bagliSermaye: 25500, aylar: 11 },
];

// --- 3. SEPET & KAMPANYA VERİLERİ ---
const aovTrendData = [
  { month: '1. Hafta', aov: 380, upt: 1.8 },
  { month: '2. Hafta', aov: 410, upt: 2.1 },
  { month: '3. Hafta', aov: 395, upt: 1.9 },
  { month: '4. Hafta', aov: 460, upt: 2.4 }, 
];

const crossSellPairs = [
  { main: 'Oversize Kot Ceket', paired: 'Beyaz Basic Tişört', matchRate: 68, extraRevenue: 24500 },
  { main: 'Spor Ayakkabı', paired: '3\'lü Spor Çorap', matchRate: 54, extraRevenue: 12800 },
  { main: 'Laptop Çantası', paired: 'Kablo Düzenleyici', matchRate: 42, extraRevenue: 8500 },
];

const campaignRoiData = [
  { code: 'YENI20', ciro: 125000, indirimMaliyeti: 25000, roi: 5.0 },
  { code: 'FENOMEN50', ciro: 280000, indirimMaliyeti: 140000, roi: 2.0 }, 
  { code: 'SEPET10', ciro: 85000, indirimMaliyeti: 8500, roi: 10.0 }, 
];

const SalesReport = () => {
  const [activeTab, setActiveTab] = useState('finance'); 

  // --- RAPOR İNDİRME FONKSİYONU ---
  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += `E-ComPilot Satis ve Urun Zekasi Raporu\n`;
    csvContent += `Rapor Tarihi:,${new Date().toLocaleDateString('tr-TR')}\n\n`;

    if (activeTab === 'finance') {
        csvContent += `--- EN KARLI URUNLER (YUKSEK MARJ) ---\n`;
        csvContent += `SKU,Urun Adi,Ciro (TL),Net Kar (TL),Marj (%)\n`;
        topProfitableProducts.forEach(item => {
            csvContent += `"${item.sku}","${item.name}",${item.ciro},${item.kar},${item.marj}\n`;
        });
        csvContent += `\n--- ZARAR ETTIREN URUNLER ---\n`;
        csvContent += `SKU,Urun Adi,Ciro (TL),Net Kar (TL),Marj (%),Sebep\n`;
        topLossMakers.forEach(item => {
            csvContent += `"${item.sku}","${item.name}",${item.ciro},${item.kar},${item.marj},"${item.reason}"\n`;
        });
    } 
    else if (activeTab === 'abc') {
        csvContent += `--- C GRUBU - TASFIYE EDILECEKLER (OLU STOK) ---\n`;
        csvContent += `SKU,Urun Adi,Bekleme (Ay),Stok Adedi,Bagli Sermaye (TL)\n`;
        cGroupLiquidationList.forEach(item => {
            csvContent += `"${item.sku}","${item.name}",${item.aylar},${item.stok},${item.bagliSermaye}\n`;
        });
    }
    else if (activeTab === 'basket') {
        csvContent += `--- SIK BIRLIKTE ALINANLAR (CROSS-SELL) ---\n`;
        csvContent += `Ana Urun,Birlikte Alinan,+ Alinma Orani (%),Yarattigi Ekstra Ciro (TL)\n`;
        crossSellPairs.forEach(item => {
            csvContent += `"${item.main}","${item.paired}",${item.matchRate},${item.extraRevenue}\n`;
        });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Satis_Raporu_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border border-slate-700 text-sm z-50 min-w-[160px]">
          <p className="font-bold mb-3 border-b border-slate-700 pb-2 text-slate-300">{label}</p>
          {payload.map((entry, index) => {
            const isMoney = entry.name.toLowerCase().includes('ciro') || entry.name.toLowerCase().includes('kar') || entry.name.toLowerCase().includes('maliyet');
            const isPercent = entry.name.toLowerCase().includes('oran') || entry.name.toLowerCase().includes('marj');
            return (
                <div key={index} className="flex items-center justify-between gap-6 py-1">
                <span className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-slate-200 font-medium">{entry.name}:</span>
                </span>
                <span className="font-black text-white">
                    {isMoney ? `₺${entry.value.toLocaleString()}` : isPercent ? `%${entry.value}` : entry.value}
                </span>
                </div>
            )
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* TABS & EXPORT BUTTON (Karmaşadan Arındırılmış Temiz Üst Menü) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         
         {/* ANA SEKMELER (TABS) */}
         <div className="flex overflow-x-auto custom-scrollbar bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-fit">
            <button 
               onClick={() => setActiveTab('finance')}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'finance' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
               <DollarSign size={18} /> Finansal Karlılık
            </button>
            <button 
               onClick={() => setActiveTab('abc')}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'abc' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
               <Layers size={18} /> Ürün & Stok Zekası (ABC)
            </button>
            <button 
               onClick={() => setActiveTab('basket')}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'basket' ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
               <ShoppingCart size={18} /> Sepet & Kampanya
            </button>
         </div>

         {/* SADECE RAPOR İNDİR BUTONU */}
         <button 
            onClick={handleExport}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md shrink-0 w-full sm:w-auto"
         >
            <Download size={16}/> Excel İndir
         </button>
      </div>

      {/* =========================================
          SEKME 1: FİNANSAL KARLILIK (NET MARGIN) 
          ========================================= */}
      {activeTab === 'finance' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              
              {/* KPI'LAR */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Brüt Ciro</p>
                    <h3 className="text-3xl font-black text-slate-800">₺580K</h3>
                    <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1"><TrendingUp size={14}/> Geçen aya göre %20 artış</p>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Toplam Operasyon Maliyeti</p>
                    <h3 className="text-3xl font-black text-slate-800">₺440K</h3>
                    <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1"><TrendingUp size={14}/> Maliyetler %24 arttı (Risk)</p>
                 </div>
                 <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl border border-emerald-400 shadow-lg text-white">
                    <p className="text-emerald-100 text-xs font-bold uppercase mb-2">Gerçek Net Kar</p>
                    <h3 className="text-3xl font-black">₺140K</h3>
                    <p className="text-xs font-bold text-emerald-100 mt-2 flex items-center gap-1"><CheckCircle2 size={14}/> Kasaya giren net tutar</p>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Net Kar Marjı</p>
                    <h3 className="text-3xl font-black text-slate-800">%15.0</h3>
                    <p className="text-xs font-bold text-orange-500 mt-2 flex items-center gap-1"><TrendingDown size={14}/> Hedefin (%20) altında</p>
                 </div>
              </div>

              {/* GRAFİKLER */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Kar Trendi */}
                 <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500"/> Ciro vs Net Kar Trendi</h3>
                            <p className="text-xs text-slate-500 mt-1">Ciro artarken karlılık aynı oranda artıyor mu?</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={financeTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                             <defs><linearGradient id="colorCiro" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2}/><stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient></defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} dy={10} />
                             <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94A3B8'}} tickFormatter={(val) => `₺${val/1000}k`} />
                             <Tooltip content={<CustomTooltip />} />
                             <Area yAxisId="left" type="monotone" dataKey="ciro" name="Brüt Ciro" stroke="#3B82F6" fill="url(#colorCiro)" strokeWidth={2} />
                             <Bar yAxisId="left" dataKey="netKar" name="Net Kar" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
                          </ComposedChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Maliyet Kırılımı (Donut) */}
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><PieChartIcon size={18} className="text-orange-500"/> Maliyet Kırılımı</h3>
                    <p className="text-xs text-slate-500 mb-6">100 TL'lik bir satışın dağılımı.</p>
                    <div className="flex-1 min-h-[200px] relative flex items-center justify-center">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie data={costBreakdownData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                                {costBreakdownData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                             </Pie>
                             <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-3xl font-black text-slate-800">%15</span>
                          <span className="text-[10px] font-bold text-emerald-500 uppercase">Kalan Kar</span>
                       </div>
                    </div>
                    <div className="mt-4 space-y-2 px-2">
                       {costBreakdownData.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ backgroundColor: item.color }}></div><span className="font-bold text-slate-600">{item.name}</span></div>
                             <span className="font-black text-slate-800">%{item.value}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* KARLI VE ZARARLI ÜRÜNLER TABLOLARI */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Şampiyonlar */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                     <div className="p-5 border-b border-slate-100 bg-emerald-50/30">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><Target size={18} className="text-emerald-600"/> En Karlı Ürünler (Yüksek Marj)</h3>
                     </div>
                     <div className="flex-1 overflow-x-auto p-2">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                           <thead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                              <tr><th className="px-4 py-3">Ürün</th><th className="px-4 py-3 text-right">Net Kar</th><th className="px-4 py-3 text-right">Marj</th></tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {topProfitableProducts.map((item, i) => (
                                 <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3"><div className="font-bold text-slate-800">{item.sku}</div><div className="text-[11px] text-slate-500">{item.name}</div></td>
                                    <td className="px-4 py-3 text-right font-black text-emerald-600">₺{item.kar.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">% {item.marj}</span></td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  {/* Zarar Ettirenler */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                     <div className="p-5 border-b border-slate-100 bg-red-50/30">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><AlertCircle size={18} className="text-red-600"/> Zarar Ettirenler (Gizli Maliyetler)</h3>
                     </div>
                     <div className="flex-1 overflow-x-auto p-2">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                           <thead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                              <tr><th className="px-4 py-3">Ürün</th><th className="px-4 py-3 text-right">Net Kar</th><th className="px-4 py-3 text-right">Sebep</th></tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {topLossMakers.map((item, i) => (
                                 <tr key={i} className="hover:bg-red-50/50 transition-colors">
                                    <td className="px-4 py-3"><div className="font-bold text-slate-800">{item.sku}</div><div className="text-[11px] text-slate-500">{item.name}</div></td>
                                    <td className="px-4 py-3 text-right font-black text-red-600">₺{item.kar.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right"><span className="text-[11px] font-bold text-slate-500">{item.reason}</span></td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
              </div>
          </div>
      )}

      {/* =========================================
          SEKME 2: ÜRÜN & STOK ZEKASI (ABC) 
          ========================================= */}
      {activeTab === 'abc' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              
              {/* KPI'LAR */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">A Grubu Ürün Sayısı</p>
                    <h3 className="text-3xl font-black text-slate-800">24 <span className="text-sm font-medium text-slate-400">Adet</span></h3>
                    <p className="text-xs font-bold text-emerald-600 mt-2">Cironun %80'ini üretiyorlar</p>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">C Grubu (Ölü Stok) Maliyeti</p>
                    <h3 className="text-3xl font-black text-slate-800">₺87K</h3>
                    <p className="text-xs font-bold text-red-500 mt-2">Acil nakde çevrilmeli</p>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Ortalama Stok Devir Hızı</p>
                    <h3 className="text-3xl font-black text-slate-800">45 <span className="text-sm font-medium text-slate-400">Gün</span></h3>
                    <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1"><TrendingDown size={14}/> Depoda bekleme süresi azaldı</p>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Stoksuz Kalma (Stockout) Riski</p>
                    <h3 className="text-3xl font-black text-slate-800">3 <span className="text-sm font-medium text-slate-400">Ürün</span></h3>
                    <p className="text-xs font-bold text-amber-500 mt-2 flex items-center gap-1"><AlertTriangle size={14}/> A Grubu ürünlerde stok uyarısı!</p>
                 </div>
              </div>

              {/* GRAFİK VE TABLO YANYANA */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 
                 {/* ABC Pareto Grafiği */}
                 <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[450px]">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Layers size={18} className="text-blue-500"/> ABC Stok Analizi (Pareto)</h3>
                            <p className="text-xs text-slate-500 mt-1">Ürün oranının ciroya katkısı.</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={abcDistributionData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} dy={10} />
                             <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94A3B8'}} tickFormatter={(val) => `%${val}`} />
                             <Tooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip />} />
                             {/* Ürün oranı barı */}
                             <Bar dataKey="urunOrani" name="Katalogdaki Payı (%)" fill="#CBD5E1" radius={[4, 4, 0, 0]} barSize={20} />
                             {/* Ciro Katkısı Barı */}
                             <Bar dataKey="ciroKatkisi" name="Ciroya Katkısı (%)" radius={[4, 4, 0, 0]} barSize={40}>
                                {abcDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                             </Bar>
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Aksiyon Tablosu: Likidite Listesi */}
                 <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[450px]">
                     <div className="p-6 border-b border-slate-100 bg-red-50/20 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500"/> C Grubu - Tasfiye Edilecekler (Ölü Stok)</h3>
                            <p className="text-xs text-slate-500 mt-1">6 aydan uzun süredir depoda yatan ve sermaye bağlayan ürünler.</p>
                        </div>
                        <button className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-200 transition">Tümünü Gör</button>
                     </div>
                     <div className="flex-1 overflow-x-auto p-2">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                           <thead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                              <tr>
                                <th className="px-4 py-3">Ürün (SKU)</th>
                                <th className="px-4 py-3 text-center">Depoda Bekleme</th>
                                <th className="px-4 py-3 text-center">Mevcut Stok</th>
                                <th className="px-4 py-3 text-right">Bağlı Sermaye</th>
                                <th className="px-4 py-3 text-center">Aksiyon</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {cGroupLiquidationList.map((item, i) => (
                                 <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400"><Box size={14}/></div>
                                            <div><div className="font-bold text-slate-800">{item.sku}</div><div className="text-[10px] text-slate-500">{item.name}</div></div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center font-bold text-red-500">{item.aylar} Ay</td>
                                    <td className="px-4 py-4 text-center font-bold text-slate-700">{item.stok}</td>
                                    <td className="px-4 py-4 text-right font-black text-slate-800">₺{item.bagliSermaye.toLocaleString()}</td>
                                    <td className="px-4 py-4 text-center">
                                        <button className="px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded text-[10px] font-bold transition flex items-center gap-1 mx-auto">
                                            <Tag size={12}/> Kampanya Yap
                                        </button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                 </div>

              </div>
          </div>
      )}

      {/* =========================================
          SEKME 3: SEPET & KAMPANYA (BASKET) 
          ========================================= */}
      {activeTab === 'basket' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              
              {/* KPI'LAR */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Ortalama Sepet Tutarı (AOV)</p>
                    <h3 className="text-3xl font-black text-slate-800">₺460</h3>
                    <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1"><TrendingUp size={14}/> Kampanya etkisi (+80₺)</p>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Sepetteki Ürün (UPT)</p>
                    <h3 className="text-3xl font-black text-slate-800">2.4 <span className="text-sm font-medium text-slate-400">Adet</span></h3>
                    <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle2 size={14}/> Çapraz satışlar başarılı</p>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Kupon Kullanım Oranı</p>
                    <h3 className="text-3xl font-black text-slate-800">%34.5</h3>
                    <p className="text-xs font-bold text-slate-500 mt-2 flex items-center gap-1"><Tag size={14}/> Siparişlerin 1/3'ü indirimli</p>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Kupon Karlılığı (Ort. ROI)</p>
                    <h3 className="text-3xl font-black text-slate-800">5.6x</h3>
                    <p className="text-xs font-bold text-emerald-600 mt-2">Verilen her 1₺ indirim 5.6₺ getirdi</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 
                 {/* AOV Trendi */}
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><ShoppingCart size={18} className="text-purple-500"/> Ortalama Sepet Tutarı (AOV) Trendi</h3>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={aovTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                             <defs><linearGradient id="colorAov" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/><stop offset="95%" stopColor="#A855F7" stopOpacity={0}/></linearGradient></defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} dy={10} />
                             <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#A855F7', fontWeight: 'bold'}} tickFormatter={(val) => `₺${val}`} />
                             <Tooltip content={<CustomTooltip />} />
                             <Area type="monotone" dataKey="aov" name="Sepet Tutarı" stroke="#A855F7" strokeWidth={4} fillOpacity={1} fill="url(#colorCost)" activeDot={{ r: 6, fill: '#9333EA', stroke: '#fff', strokeWidth: 2 }} />
                          </ComposedChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Kupon ROI Analizi */}
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Tag size={18} className="text-blue-500"/> İndirim / Kupon ROI Analizi</h3>
                            <p className="text-xs text-slate-500 mt-1">Kuponun getirdiği ciro (Çubuk) vs Bizden Götürdüğü Kar (Çizgi).</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={campaignRoiData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#475569', fontWeight: 'bold'}} dy={10} />
                             <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#3B82F6'}} tickFormatter={(val) => `₺${val/1000}k`} />
                             <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#EF4444'}} tickFormatter={(val) => `₺${val/1000}k`} />
                             <Tooltip content={<CustomTooltip />} />
                             <Bar yAxisId="left" dataKey="ciro" name="Getirdiği Ciro" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                             <Line yAxisId="right" type="monotone" dataKey="indirimMaliyeti" name="Feragat Edilen Kar (Maliyet)" stroke="#EF4444" strokeWidth={3} dot={{ r: 5, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} />
                          </ComposedChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              {/* Çapraz Satış (Cross-Sell) Tablosu */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><Link size={18} className="text-emerald-500"/> Sık Birlikte Alınanlar (Cross-Sell Zekası)</h3>
                        <p className="text-xs text-slate-500 mt-1">Bu ürünleri paket (bundle) yaparak veya sepet aşamasında önererek AOV'yi artırın.</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-x-auto p-2">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                          <tr><th className="px-6 py-4">Ana Ürün</th><th className="px-6 py-4 text-center">Birlikte Alınan Ürün</th><th className="px-6 py-4 text-center">Birlikte Alınma Oranı</th><th className="px-6 py-4 text-right">Yarattığı Ekstra Ciro</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {crossSellPairs.map((item, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800">{item.main}</td>
                                <td className="px-6 py-4 text-center"><span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold border border-blue-100">+ {item.paired}</span></td>
                                <td className="px-6 py-4 text-center font-black text-slate-700">%{item.matchRate}</td>
                                <td className="px-6 py-4 text-right font-black text-emerald-600">₺{item.extraRevenue.toLocaleString()}</td>
                              </tr>
                          ))}
                        </tbody>
                    </table>
                  </div>
              </div>

          </div>
      )}

    </div>
  );
};

export default SalesReport;