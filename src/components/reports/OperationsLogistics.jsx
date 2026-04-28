import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Truck, Clock, AlertTriangle, ArrowRight, RotateCcw, 
  TrendingDown, TrendingUp, Download, Calendar, Zap, ShieldAlert,
  PackageOpen, AlertCircle, CheckCircle2, DollarSign, Loader2, Map, 
  CreditCard, Star, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, PieChart, Pie, Cell, ReferenceLine, AreaChart, Area
} from 'recharts';

// --- FIREBASE SERVİSİ ---
import { subscribeToTasks } from '../../firebase/taskService';
import { useAuth } from '../../context/AuthContext';

// --- DEMO / YEDEK VERİLER ---
const BASE_CARGO = [
  { name: 'Yurtiçi', avgDays: 1.8, damageRate: 1.2 }, { name: 'Aras', avgDays: 2.4, damageRate: 2.1 },
  { name: 'MNG', avgDays: 2.1, damageRate: 1.8 }, { name: 'PTT', avgDays: 4.5, damageRate: 0.8 }, { name: 'Kolay Gelsin', avgDays: 0.9, damageRate: 0.2 }, 
];
const BASE_RETURNS = [
  { name: 'Beden Uymadı', value: 42, color: '#3B82F6' }, { name: 'Kusurlu/Hasarlı', value: 28, color: '#EF4444' },
  { name: 'Görselden Farklı', value: 15, color: '#F59E0B' }, { name: 'Geç Teslimat', value: 10, color: '#8B5CF6' }, { name: 'Diğer', value: 5, color: '#94A3B8' },
];
const BASE_TOP_RETURNS = [
  { sku: 'TSH-001-BLK', name: 'Siyah Basic Tişört', category: 'Giyim', returnRate: 14.5, totalReturned: 145, lostRevenue: 43500, mainReason: 'Beden Uymadı', trend: 'up' },
  { sku: 'SHS-042-WHT', name: 'Beyaz Sneaker', category: 'Ayakkabı', returnRate: 18.2, totalReturned: 82, lostRevenue: 65600, mainReason: 'Kusurlu/Hasarlı', trend: 'down' },
  { sku: 'DRS-018-RED', name: 'Kırmızı Elbise', category: 'Giyim', returnRate: 15.1, totalReturned: 64, lostRevenue: 38400, mainReason: 'Görselden Farklı', trend: 'up' },
  { sku: 'JCK-009-BLU', name: 'Mavi Kot Ceket', category: 'Dış Giyim', returnRate: 8.4, totalReturned: 41, lostRevenue: 24600, mainReason: 'Beden Uymadı', trend: 'down' },
  { sku: 'ACC-055-GLD', name: 'Zincir Kolye', category: 'Aksesuar', returnRate: 22.5, totalReturned: 38, lostRevenue: 11400, mainReason: 'Kusurlu/Hasarlı', trend: 'up' },
];
const BASE_REGIONAL = [
  { city: 'İstanbul', orders: 4500, avgDays: 1.1 }, { city: 'Ankara', orders: 2800, avgDays: 1.4 },
  { city: 'İzmir', orders: 2100, avgDays: 1.5 }, { city: 'Bursa', orders: 1800, avgDays: 1.8 },
  { city: 'Antalya', orders: 1500, avgDays: 1.9 }, { city: 'Diyarbakır', orders: 600, avgDays: 3.2 },
];
const RETURN_CATEGORIES = [
  { name: 'Giyim', value: 45 }, { name: 'Ayakkabı', value: 25 }, { name: 'Aksesuar', value: 15 }, { name: 'Kozmetik', value: 10 }, { name: 'Ev/Yaşam', value: 5 }
];


const getStableHash = (input) => {
  return Array.from(input).reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) % 1000003, 7);
};

const getStableNumber = (key, min, max, precision = 1) => {
  const hash = getStableHash(key);
  const normalized = (hash % 10000) / 10000;
  const value = min + normalized * (max - min);
  return Number(value.toFixed(precision));
};

const getStableInteger = (key, min, max) => {
  const hash = getStableHash(key);
  return min + (hash % (max - min + 1));
};


const OperationsTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border border-slate-700 text-sm z-50 min-w-[160px]">
      <p className="font-bold mb-3 border-b border-slate-700 pb-2 text-slate-300">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-6 py-1">
          <span className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: entry.color }}></div>
            <span className="text-slate-200 font-medium">{entry.name}:</span>
          </span>
          <span className="font-black text-white">
            {entry.name.includes('Oran') || entry.name.includes('Rate')
              ? `%${entry.value}`
              : entry.name.includes('Maliyet')
                ? `₺${entry.value.toLocaleString()}`
                : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const OperationsLogistics = () => {
  const { userData } = useAuth();
  const isManager = ['Admin', 'Manager', 'CEO', 'Director'].includes(userData?.role);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Gelişmiş Tarih State'leri
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [quickDate, setQuickDate] = useState('Son 30 Gün');
  const [customStart, setCustomStart] = useState(() => {
     const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const unsubTasks = subscribeToTasks(
      setTasks,
      { uid: userData?.uid, isManagement: isManager }
    );
    setTimeout(() => setLoading(false), 800); 
    return () => unsubTasks();
  }, [userData, isManager]);

  // --- GÜVENLİ VE KAPSAMLI TARİH FİLTRESİ HESAPLAMA ---
  const dateLimits = useMemo(() => {
    if (isCustomDate) {
        return { start: customStart || '2000-01-01', end: customEnd || '2099-12-31' };
    }

    const today = new Date();
    let start = new Date(today); 
    let end = new Date(today);
    
    if (quickDate === 'Bugün') { 
        // Start ve End zaten bugün
    }
    else if (quickDate === 'Dün') { 
        start.setDate(today.getDate() - 1); 
        end.setDate(today.getDate() - 1); 
    }
    else if (quickDate === 'Son 7 Gün') { 
        start.setDate(today.getDate() - 7); 
    } 
    else if (quickDate === 'Son 30 Gün') { 
        start.setDate(today.getDate() - 30); 
    } 
    else if (quickDate === 'Bu Yıl') { 
        start.setMonth(0, 1); 
    }
    
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }, [isCustomDate, quickDate, customStart, customEnd]);

  // --- GERÇEK VERİLERLE HESAPLAMA MOTORU ---
  const { fulfillmentData, bottleneckData, costData, kpiStats, hasRealData } = useMemo(() => {
    const filteredTasks = tasks.filter(t => {
       const taskDate = t.dueDate || (typeof t.createdAt === 'string' ? t.createdAt.split('T')[0] : '2099-01-01');
       return taskDate >= dateLimits.start && taskDate <= dateLimits.end;
    });

    const isReal = filteredTasks.length > 0;

    let statusCounts = { 'Bekliyor': 0, 'Devam Ediyor': 0, 'İnceleniyor': 0, 'Tamamlandı': 0, 'İptal': 0 };
    filteredTasks.forEach(t => { if(statusCounts[t.status] !== undefined) statusCounts[t.status]++; });

    const calcWaitTime = (count) => isReal ? parseFloat((Math.max(1, count * 1.5)).toFixed(1)) : 0;

    const realBottleneckData = [
      { stage: 'Yeni Sipariş', waitTime: isReal ? calcWaitTime(statusCounts['Bekliyor']) : 1.2, limit: 4 },
      { stage: 'İşlemde', waitTime: isReal ? calcWaitTime(statusCounts['Devam Ediyor']) : 4.5, limit: 6 },
      { stage: 'Onay Bekliyor', waitTime: isReal ? calcWaitTime(statusCounts['İnceleniyor']) : 14.8, limit: 8 }, 
      { stage: 'Tamamlandı', waitTime: isReal ? 2.1 : 3.2, limit: 4 },
    ];

    const worstStage = realBottleneckData.reduce((prev, current) => (prev.waitTime > current.waitTime) ? prev : current, realBottleneckData[0]);

    // Dinamik Gün Üretici (Seçili tarihe göre)
    const diffDays = Math.ceil((new Date(dateLimits.end) - new Date(dateLimits.start)) / (1000 * 60 * 60 * 24));
    const renderDays = Math.max(1, Math.min(diffDays + 1, 14)); // Ekrana max 14 çubuk çiz (Dün/Bugün gibi tek günse 1 çubuk)

    const dates = [];
    for(let i=renderDays-1; i>=0; i--) {
        const d = new Date(dateLimits.end); d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const realFulfillmentData = dates.map(dateStr => {
        const dayCompleted = tasks.filter(t => t.status === 'Tamamlandı' && (t.dueDate === dateStr || (typeof t.createdAt === 'string' && t.createdAt.includes(dateStr)))).length;
        const baseSpeed = 10;
        const speedPenalty = dayCompleted * 0.5;
        
        return {
            date: new Date(dateStr).toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'}),
            shopify: isReal
              ? Number((baseSpeed + speedPenalty + getStableNumber(`${dateStr}-shopify`, 0, 2, 1)).toFixed(1))
              : getStableNumber(`${dateStr}-shopify-fallback`, 10, 20, 1),
            trendyol: isReal
              ? Number((baseSpeed + speedPenalty + 4 + getStableNumber(`${dateStr}-trendyol`, 0, 3, 1)).toFixed(1))
              : getStableNumber(`${dateStr}-trendyol-fallback`, 15, 30, 1),
            totalOrders: isReal ? dayCompleted : getStableInteger(`${dateStr}-orders`, 50, 149)
        }
    });

    const generatedCostData = dates.map((dateStr, i) => {
        const orders = realFulfillmentData[i].totalOrders;
        const unitCost = getStableNumber(`${dateStr}-unit-cost`, 45, 50, 2);
        return {
            date: new Date(dateStr).toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'}),
            unitCost: unitCost,
            totalCost: Math.floor(orders * unitCost)
        }
    });

    const avgFulfillment = parseFloat((realFulfillmentData.reduce((acc, curr) => acc + curr.shopify + curr.trendyol, 0) / (realFulfillmentData.length * 2)).toFixed(1));

    // CSAT Hesaplama (Simülasyon)
    let csat = 4.8;
    if (avgFulfillment > 24) csat -= 0.5;
    if (worstStage.waitTime > 10) csat -= 0.3;

    return {
        fulfillmentData: realFulfillmentData,
        bottleneckData: realBottleneckData,
        costData: generatedCostData,
        kpiStats: {
            avgFulfillment: isNaN(avgFulfillment) ? 16.4 : avgFulfillment,
            worstStage: worstStage.stage,
            worstStageTime: worstStage.waitTime,
            csat: Math.max(1, parseFloat(csat.toFixed(1)))
        },
        hasRealData: isReal
    };

  }, [tasks, dateLimits]);

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += `E-ComPilot Lojistik ve Operasyon Raporu\n`;
    csvContent += `Rapor Tarihi:,${new Date().toLocaleDateString('tr-TR')}\n`;
    csvContent += `Filtre:,${isCustomDate ? `${customStart} / ${customEnd}` : quickDate}\n\n`;

    csvContent += `--- OPERASYON OZETI ---\n`;
    csvContent += `Ortalama Karsilama Hizi (Saat),${kpiStats.avgFulfillment}\n`;
    csvContent += `Mevcut Darbogaz,${kpiStats.worstStage} (${kpiStats.worstStageTime} Saat Yigilma)\n`;
    csvContent += `Ortalama Iade Orani, %8.2\n`;
    csvContent += `Musteri Memnuniyeti (CSAT), ${kpiStats.csat} / 5.0\n\n`;

    csvContent += `--- EN COK IADE EDILEN URUNLER (MALIYET ETKISI) ---\n`;
    csvContent += `SKU,Urun Adi,Kategori,Iade Adedi,Iade Orani (%),Kayip Ciro (TL),Temel Neden\n`;
    BASE_TOP_RETURNS.forEach(item => {
        csvContent += `"${item.sku}","${item.name}","${item.category}",${item.totalReturned},${item.returnRate},${item.lostRevenue},"${item.mainReason}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Lojistik_Raporu_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (loading) return <div className="flex h-screen items-center justify-center text-slate-400"><Loader2 className="animate-spin mr-2" size={32}/> Operasyon Komuta Merkezi Yükleniyor...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER & GELİŞMİŞ FİLTRELER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <PackageOpen className="text-blue-600"/> Lojistik Komuta Merkezi
              {!hasRealData && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse ml-2">Simülasyon Modu</span>}
          </h2>
          <p className="text-sm text-slate-500 mt-1">Uçtan uca sipariş karşılama, kargo performansı ve maliyet analizleri.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
           
           {/* HIZLI / ÖZEL TARİH SEÇİCİ TOGGLE */}
           <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              <button 
                onClick={() => setIsCustomDate(false)} 
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${!isCustomDate ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 Hızlı Seçim
              </button>
              <button 
                onClick={() => setIsCustomDate(true)} 
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${isCustomDate ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 Özel Tarih
              </button>
           </div>

           {/* TARİH GİRDİLERİ (AÇILIR MENÜ VE DÜN EKLENDİ) */}
           {!isCustomDate ? (
               <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <Calendar size={16} className="text-slate-500"/>
                  <select 
                     value={quickDate} 
                     onChange={e => setQuickDate(e.target.value)} 
                     className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                  >
                     <option>Bugün</option>
                     <option>Dün</option>
                     <option>Son 7 Gün</option>
                     <option>Son 30 Gün</option>
                     <option>Bu Yıl</option>
                  </select>
               </div>
           ) : (
               <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm focus-within:border-blue-400 transition">
                  <Calendar size={14} className="text-blue-500"/>
                  <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-transparent text-sm text-slate-700 font-bold outline-none cursor-pointer"/>
                  <span className="text-slate-300">-</span>
                  <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-transparent text-sm text-slate-700 font-bold outline-none cursor-pointer"/>
               </div>
           )}

           <button onClick={handleExport} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95">
              <Download size={16}/> Excel İndir
           </button>
        </div>
      </div>

      {/* İLERİ DÜZEY KPI KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
         
         <div className="bg-gradient-to-br from-white to-blue-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-all relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4 relative z-10">
               <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ort. Karşılama Hızı</p>
               <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Clock size={20}/></div>
            </div>
            <div className="relative z-10 flex items-end justify-between">
                <div>
                    <h3 className="text-3xl font-black text-slate-800">{kpiStats.avgFulfillment} <span className="text-base font-semibold text-slate-400">Saat</span></h3>
                    <p className={`text-xs font-bold mt-1 flex items-center gap-1 ${kpiStats.avgFulfillment < 24 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {kpiStats.avgFulfillment < 24 ? <><TrendingDown size={14}/> SLA Altında</> : <><TrendingUp size={14}/> SLA Aşıldı</>}
                    </p>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-16 opacity-30">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fulfillmentData}><Area type="monotone" dataKey="shopify" stroke="#3B82F6" fill="#3B82F6" strokeWidth={2} /></AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-gradient-to-br from-white to-amber-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-amber-300 transition-all relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4 relative z-10">
               <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ana Darboğaz</p>
               <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><Zap size={20}/></div>
            </div>
            <div className="relative z-10">
                <h3 className="text-xl font-black text-slate-800 mt-1 truncate" title={kpiStats.worstStage}>{kpiStats.worstStage}</h3>
                <p className="text-xs font-bold text-amber-600 mt-2 flex items-center gap-1 bg-amber-50 w-max px-2 py-0.5 rounded border border-amber-100">
                    <AlertTriangle size={12}/> {kpiStats.worstStageTime} Saat Yığılma
                </p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-16 opacity-30">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bottleneckData}><Bar dataKey="waitTime" fill="#F59E0B" radius={[2,2,0,0]} /></BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-gradient-to-br from-white to-emerald-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-emerald-300 transition-all relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4 relative z-10">
               <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Müşteri Memnuniyeti</p>
               <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Star size={20}/></div>
            </div>
            <div className="relative z-10">
                <h3 className="text-3xl font-black text-slate-800">{kpiStats.csat} <span className="text-base font-semibold text-slate-400">/ 5.0</span></h3>
                <p className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 size={12}/> CSAT Skoru Çok İyi</p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-16 opacity-30">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fulfillmentData}><Area type="monotone" dataKey="trendyol" stroke="#10B981" fill="#10B981" strokeWidth={2} /></AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-gradient-to-br from-white to-red-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-red-300 transition-all relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4 relative z-10">
               <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">İade Kaynaklı Kayıp</p>
               <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><RotateCcw size={20}/></div>
            </div>
            <div className="relative z-10">
                <h3 className="text-3xl font-black text-slate-800">₺183k <span className="text-base font-semibold text-slate-400">Tahmini</span></h3>
                <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1"><TrendingUp size={12}/> İade oranı %8.2</p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-16 opacity-30">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fulfillmentData}><Bar dataKey="shopify" fill="#EF4444" radius={[2,2,0,0]} /></BarChart>
               </ResponsiveContainer>
            </div>
         </div>

      </div>

      {/* --- ANA GRAFİKLER (HIZ, DARBOĞAZ VE MALİYET) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><PackageOpen size={18} className="text-blue-500"/> Sipariş Karşılama Hızı (SLA)</h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                    <span className="flex items-center gap-1 text-slate-600"><div className="w-2.5 h-2.5 rounded bg-emerald-400"></div> Sitemiz</span>
                    <span className="flex items-center gap-1 text-slate-600"><div className="w-2.5 h-2.5 rounded bg-orange-400"></div> Pazaryeri</span>
                </div>
            </div>
            <div className="flex-1 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fulfillmentData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorShopify" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34D399" stopOpacity={1}/><stop offset="100%" stopColor="#10B981" stopOpacity={0.8}/></linearGradient>
                        <linearGradient id="colorTrendyol" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FB923C" stopOpacity={1}/><stop offset="100%" stopColor="#F59E0B" stopOpacity={0.8}/></linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                     <Tooltip cursor={{fill: '#f8fafc'}} content={<OperationsTooltip />} />
                     <ReferenceLine y={24} stroke="#EF4444" strokeDasharray="5 5" strokeWidth={2} label={{ position: 'top', value: 'SLA Max (24s)', fill: '#EF4444', fontSize: 10, fontWeight: 'bold' }} />
                     <Bar dataKey="shopify" name="Kendi Sitemiz" fill="url(#colorShopify)" radius={[4, 4, 0, 0]} barSize={16} />
                     <Bar dataKey="trendyol" name="Pazaryeri" fill="url(#colorTrendyol)" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><ArrowRight size={18} className="text-amber-500"/> Darboğaz Analizi</h3>
                </div>
            </div>
            <div className="flex-1 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bottleneckData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#475569', fontWeight: 'bold'}} width={110} />
                     <Tooltip cursor={{fill: '#f8fafc'}} content={<OperationsTooltip />} />
                     <Bar dataKey="waitTime" name="Yığılma / Bekleme (Birim)" radius={[0, 4, 4, 0]} barSize={24}>
                        {bottleneckData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.waitTime > entry.limit ? '#EF4444' : entry.waitTime > (entry.limit * 0.6) ? '#F59E0B' : '#3B82F6'} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

      </div>

      {/* --- LOJİSTİK VE BÖLGESEL HARİTA --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
            <div className="flex justify-between items-start mb-6">
                <div><h3 className="font-bold text-slate-800 flex items-center gap-2"><CreditCard size={18} className="text-purple-500"/> Kargo Birim Maliyetleri</h3></div>
            </div>
            <div className="flex-1 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={costData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                     <defs><linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/><stop offset="95%" stopColor="#A855F7" stopOpacity={0}/></linearGradient></defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} tickFormatter={(val) => `₺${val}`} />
                     <Tooltip content={<OperationsTooltip />} />
                     <Area type="monotone" dataKey="unitCost" name="Ort. Kargo Maliyeti" stroke="#A855F7" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" activeDot={{ r: 6, strokeWidth: 0, fill: '#7E22CE' }} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
            <div className="flex justify-between items-start mb-8">
                <div><h3 className="font-bold text-slate-800 flex items-center gap-2"><Truck size={18} className="text-blue-500"/> Kargo Firması Başarı Matrisi</h3></div>
                <div className="flex items-center gap-3 text-[10px] font-bold bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                    <span className="flex items-center gap-1 text-slate-600"><div className="w-2.5 h-2.5 rounded bg-blue-400"></div> Hız</span>
                    <span className="flex items-center gap-1 text-slate-600"><div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-red-200"></div> Hasar</span>
                </div>
            </div>
            <div className="flex-1 w-full opacity-95">
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={BASE_CARGO} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                     <defs><linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60A5FA" stopOpacity={1}/><stop offset="100%" stopColor="#3B82F6" stopOpacity={0.8}/></linearGradient></defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#475569', fontWeight: 'bold'}} dy={10} />
                     <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#3B82F6', fontWeight: 'bold'}} />
                     <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#EF4444', fontWeight: 'bold'}} tickFormatter={(value) => `%${value}`} />
                     <Tooltip content={<OperationsTooltip />} />
                     <Bar yAxisId="left" dataKey="avgDays" name="Ort. Teslimat (Gün)" fill="url(#colorDays)" radius={[6, 6, 0, 0]} barSize={32} />
                     <Line yAxisId="right" type="monotone" dataKey="damageRate" name="Hasar Oranı" stroke="#EF4444" strokeWidth={4} dot={{ r: 5, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, fill: '#DC2626' }} />
                  </ComposedChart>
               </ResponsiveContainer>
            </div>
         </div>

      </div>

      {/* --- ALT TABLOLAR: İADELER VE KATEGORİLER --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         
         {/* Kategori Bazlı İadeler */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-fit self-start w-full">
            <div className="flex justify-between items-start mb-6">
                <div><h3 className="font-bold text-slate-800 flex items-center gap-2"><Filter size={18} className="text-emerald-500"/> Kategori İade Dağılımı</h3></div>
            </div>
            <div className="w-full h-64">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={RETURN_CATEGORIES} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} width={80} />
                     <Tooltip cursor={{fill: '#f8fafc'}} content={<OperationsTooltip />} />
                     <Bar dataKey="value" name="İade Oranı" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20}>
                        {RETURN_CATEGORIES.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.value > 20 ? '#F59E0B' : entry.value > 40 ? '#EF4444' : '#10B981'} />)}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* İade Şampiyonları */}
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden xl:col-span-2">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
               <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><RotateCcw size={18} className="text-red-500"/> İade Şampiyonları & Finansal Etki</h3>
                  <p className="text-xs text-slate-500 mt-1">Maliyet yaratan en çok iade edilen ürünler.</p>
               </div>
            </div>
            <div className="flex-1 overflow-x-auto min-h-[250px] opacity-95">
               <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-white text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                     <tr>
                        <th className="px-6 py-5">Ürün Bilgisi</th>
                        <th className="px-6 py-5 text-center">İade Adedi</th>
                        <th className="px-6 py-5 text-left w-48">İade Oranı</th>
                        <th className="px-6 py-5 text-right">Tahmini Kayıp Ciro</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {BASE_TOP_RETURNS.map((item, index) => (
                        <tr key={index} className="hover:bg-red-50/40 transition-colors group">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm"><Package size={18}/></div>
                                 <div><div className="font-bold text-slate-800 text-sm mb-0.5">{item.sku}</div><div className="text-[11px] font-medium text-slate-500">{item.name}</div></div>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center"><span className="font-black text-slate-700 text-base">{item.totalReturned} <span className="text-[10px] font-bold text-slate-400 uppercase">Adet</span></span></td>
                           <td className="px-6 py-4">
                              <div className="flex flex-col gap-1.5 w-full max-w-[150px]">
                                  <div className="flex justify-between items-center text-[11px] font-black">
                                      <span className={item.returnRate > 15 ? 'text-red-600' : 'text-blue-600'}>%{item.returnRate}</span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${item.returnRate > 15 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, item.returnRate * 4)}%` }}></div>
                                  </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                               <div className="flex items-center justify-end gap-1 font-black text-slate-800"><DollarSign size={14} className="text-red-400"/><span>{item.lostRevenue.toLocaleString('tr-TR')} ₺</span></div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
};

export default OperationsLogistics;
