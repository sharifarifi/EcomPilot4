import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle, Clock, Star, TrendingUp, Award, 
  Briefcase, Filter, Download, Search, MoreHorizontal, 
  ArrowUpRight, AlertCircle, Calendar, ChevronDown
} from 'lucide-react';

// --- YARDIMCI BİLEŞEN: SKELETON (YÜKLEME) SATIRI ---
const TableRowSkeleton = () => (
  <tr className="animate-pulse border-b border-slate-50">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
        <div className="space-y-2">
          <div className="w-24 h-3 bg-slate-100 rounded"></div>
          <div className="w-16 h-2 bg-slate-100 rounded"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4"><div className="w-20 h-6 bg-slate-100 rounded-lg"></div></td>
    <td className="px-6 py-4 text-center"><div className="w-16 h-4 bg-slate-100 rounded mx-auto"></div></td>
    <td className="px-6 py-4 text-center">
       <div className="w-12 h-3 bg-slate-100 rounded mx-auto mb-1"></div>
       <div className="w-20 h-1.5 bg-slate-100 rounded-full mx-auto"></div>
    </td>
    <td className="px-6 py-4 text-center"><div className="w-10 h-4 bg-slate-100 rounded mx-auto"></div></td>
    <td className="px-6 py-4 text-center"><div className="w-14 h-6 bg-slate-100 rounded-lg mx-auto"></div></td>
    <td className="px-6 py-4 text-right"><div className="w-8 h-8 bg-slate-100 rounded-full ml-auto"></div></td>
  </tr>
);

// --- KPI KARTI ---
const KPICard = ({ title, value, subValue, icon: Icon, color, loading }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group h-full">
    {loading ? (
      <div className="animate-pulse space-y-4">
        <div className="flex justify-between">
           <div className="h-10 w-10 bg-slate-100 rounded-xl"></div>
           <div className="h-6 w-16 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="space-y-2">
           <div className="h-8 w-24 bg-slate-100 rounded"></div>
           <div className="h-4 w-32 bg-slate-100 rounded"></div>
        </div>
      </div>
    ) : (
      <div className="animate-in fade-in duration-500">
        <div className="flex justify-between items-start mb-3">
          <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={22} />
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
            <TrendingUp size={14}/> +%4.2
          </span>
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
          <p className="text-sm font-medium text-slate-500 mt-1 flex justify-between items-center">
            <span>{title}</span>
            <span className="text-slate-400 text-xs font-normal">{subValue}</span>
          </p>
        </div>
      </div>
    )}
  </div>
);

// --- ANA BİLEŞEN ---
const StaffReport = () => {
  const [filterDept, setFilterDept] = useState('Tümü');
  const [dateRange, setDateRange] = useState('Bu Ay');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [staffData] = useState([
    { id: 1, name: 'Ahmet Yılmaz', role: 'Lojistik', tasks: 145, completed: 140, score: 9.8, hours: 168, status: 'online' },
    { id: 2, name: 'Merve Kaya', role: 'Marketing', tasks: 52, completed: 48, score: 9.2, hours: 160, status: 'busy' },
    { id: 3, name: 'Caner Baran', role: 'Yazılım', tasks: 35, completed: 35, score: 10.0, hours: 172, status: 'offline' },
    { id: 4, name: 'Selin Demir', role: 'Destek', tasks: 210, completed: 195, score: 8.9, hours: 155, status: 'online' },
    { id: 5, name: 'Ozan Tekin', role: 'Lojistik', tasks: 120, completed: 100, score: 8.2, hours: 140, status: 'offline' },
    { id: 6, name: 'Elif Şahin', role: 'Yazılım', tasks: 45, completed: 40, score: 9.5, hours: 165, status: 'online' },
  ]);

  const filteredStaff = staffData.filter(p => filterDept === 'Tümü' || p.role === filterDept);

  // --- AKICI GEÇİŞ SİMÜLASYONU ---
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [dateRange, filterDept, startDate, endDate]);

  const showToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // --- CSV DIŞA AKTARMA (DÜZELTİLDİ) ---
  const handleExport = () => {
    showToast("Rapor hazırlanıyor ve indiriliyor...");
    
    // 1. Başlıklar
    const headers = ["ID,Isim,Departman,Durum,Toplam_Gorev,Tamamlanan,Puan,Calisma_Saati"];
    
    // 2. Satırlar (Filtrelenmiş veriyi kullanıyoruz)
    const rows = filteredStaff.map(p => 
      `${p.id},${p.name},${p.role},${p.status},${p.tasks},${p.completed},${p.score},${p.hours}`
    );
    
    // 3. Birleştirme (BOM \uFEFF ekledik ki Excel Türkçe karakterleri düzgün açsın)
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    
    // 4. İndirme Linki Oluşturma
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    // Dosya ismine tarih ekleyelim
    const fileName = `Personel_Raporu_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.csv`;
    link.setAttribute("download", fileName);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'Lojistik': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Marketing': return 'bg-pink-50 text-pink-700 border-pink-100';
      case 'Yazılım': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Destek': return 'bg-orange-50 text-orange-700 border-orange-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* 1. HEADER & FILTER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Personel Performansı</h2>
          <p className="text-sm text-slate-500 font-medium">Ekip verimliliği ve detaylı görev analizleri.</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
           {/* DEPARTMAN SEÇİCİ */}
           <div className="relative w-full sm:w-auto group">
              <select 
                value={filterDept} 
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full sm:w-44 appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer hover:border-slate-300"
              >
                 <option>Tümü</option><option>Lojistik</option><option>Marketing</option><option>Yazılım</option><option>Destek</option>
              </select>
              <Briefcase size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors"/>
              <ChevronDown size={16} className="absolute right-3.5 top-3 text-slate-400 pointer-events-none"/>
           </div>

           {/* TARİH ARALIĞI */}
           <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 w-full sm:w-auto hover:border-slate-300 transition-colors">
              <div className="relative">
                 <select 
                   value={dateRange} 
                   onChange={(e) => setDateRange(e.target.value)}
                   className="appearance-none bg-transparent pl-9 pr-8 py-1.5 text-sm font-bold text-slate-700 outline-none cursor-pointer min-w-[130px]"
                 >
                    <option>Bu Hafta</option><option>Bu Ay</option><option>Bu Yıl</option><option>Özel Tarih</option>
                 </select>
                 <Calendar size={16} className="absolute left-2.5 top-2 text-slate-400 pointer-events-none"/>
                 <ChevronDown size={14} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none"/>
              </div>

              {dateRange === 'Özel Tarih' && (
                 <div className="flex items-center gap-2 pl-2 border-l border-slate-200 animate-in fade-in slide-in-from-left-2 duration-300 pr-2">
                    <input type="date" className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 outline-none focus:border-blue-500" value={startDate} onChange={(e) => setStartDate(e.target.value)}/>
                    <span className="text-slate-300 text-xs font-bold">-</span>
                    <input type="date" className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 outline-none focus:border-blue-500" value={endDate} onChange={(e) => setEndDate(e.target.value)}/>
                 </div>
              )}
           </div>

           {/* RAPORLA BUTONU (ARTIK ÇALIŞIYOR) */}
           <button 
             onClick={handleExport}
             className="w-full sm:w-auto bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200 active:scale-95 duration-200"
           >
              <Download size={16}/> Raporla
           </button>
        </div>
      </div>

      {/* 2. KPI KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
         <KPICard title="Toplam Personel" value="24" subValue="21 Aktif" icon={Users} color="blue" loading={loading}/>
         <KPICard title="Ort. Verimlilik" value="%92" subValue="Hedef: %85" icon={TrendingUp} color="emerald" loading={loading}/>
         <KPICard title="Tamamlanan Görev" value="1,452" subValue="Bekleyen: 120" icon={CheckCircle} color="purple" loading={loading}/>
         <KPICard title="Toplam Mesai" value="3,840s" subValue="Ort: 160s/kişi" icon={Clock} color="orange" loading={loading}/>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         
         {/* 3. LİDERLİK TABLOSU */}
         <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[350px] transition-all hover:shadow-blue-200 hover:shadow-xl">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Award size={120}/></div>
            <div className="relative z-10">
               <h3 className="text-lg font-bold flex items-center gap-2 mb-1"><Star size={20} className="text-yellow-400 fill-yellow-400"/> Ayın Yıldızları</h3>
               <p className="text-blue-200 text-xs">En yüksek performans skoruna sahip ekip üyeleri.</p>
            </div>
            
            {loading ? (
               <div className="flex items-end justify-center gap-4 h-48 animate-pulse">
                  <div className="w-16 h-24 bg-white/20 rounded-t-lg"></div>
                  <div className="w-20 h-32 bg-white/30 rounded-t-lg"></div>
                  <div className="w-16 h-16 bg-white/10 rounded-t-lg"></div>
               </div>
            ) : (
               <div className="flex items-end justify-center gap-4 relative z-10 mt-6 animate-in slide-in-from-bottom-4 duration-700 fade-in">
                  <div className="flex flex-col items-center gap-2">
                     <div className="w-12 h-12 rounded-full border-2 border-slate-300 bg-white/20 flex items-center justify-center text-sm font-bold shadow-lg backdrop-blur-sm">AH</div>
                     <div className="text-center"><span className="block text-xs font-bold">Ahmet</span><span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white backdrop-blur-md">9.8</span></div>
                     <div className="w-16 h-24 bg-gradient-to-t from-white/5 to-white/20 rounded-t-lg border-t border-white/20 flex items-end justify-center pb-2 transition-all hover:h-28"><span className="text-2xl font-black text-white/50">2</span></div>
                  </div>
                  <div className="flex flex-col items-center gap-2 mb-4">
                     <div className="relative">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce"><Award size={24} fill="currentColor"/></div>
                        <div className="w-16 h-16 rounded-full border-2 border-yellow-400 bg-white/20 flex items-center justify-center text-lg font-bold shadow-xl backdrop-blur-sm">CB</div>
                     </div>
                     <div className="text-center"><span className="block text-sm font-bold text-yellow-300">Caner</span><span className="text-[10px] bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded shadow-lg">10.0</span></div>
                     <div className="w-20 h-32 bg-gradient-to-t from-yellow-500/20 to-yellow-400/40 rounded-t-lg border-t border-yellow-400/50 flex items-end justify-center pb-2 transition-all hover:h-36"><span className="text-3xl font-black text-yellow-100">1</span></div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                     <div className="w-12 h-12 rounded-full border-2 border-orange-300 bg-white/20 flex items-center justify-center text-sm font-bold shadow-lg backdrop-blur-sm">MK</div>
                     <div className="text-center"><span className="block text-xs font-bold">Merve</span><span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white backdrop-blur-md">9.2</span></div>
                     <div className="w-16 h-16 bg-gradient-to-t from-white/5 to-white/20 rounded-t-lg border-t border-white/20 flex items-end justify-center pb-2 transition-all hover:h-20"><span className="text-2xl font-black text-white/50">3</span></div>
                  </div>
               </div>
            )}
         </div>

         {/* 4. DEPARTMAN DAĞILIMI */}
         <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Briefcase size={20} className="text-blue-500"/> İş Yükü Dağılımı</h3>
               <div className="flex gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Tamamlanan</span>
                  <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-200"></span> Bekleyen</span>
               </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-5">
               {loading ? (
                  [1,2,3,4].map(i => <div key={i} className="h-8 bg-slate-50 rounded-lg animate-pulse"></div>)
               ) : (
                  [{ l: 'Lojistik', v: 85, c: 'bg-blue-500' }, { l: 'Marketing', v: 65, c: 'bg-pink-500' }, { l: 'Yazılım', v: 92, c: 'bg-purple-500' }, { l: 'Destek', v: 78, c: 'bg-orange-500' }].map((d, i) => (
                     <div key={i} className="group">
                        <div className="flex justify-between text-sm font-bold text-slate-600 mb-1.5"><span>{d.l}</span><span className="text-slate-800">%{d.v}</span></div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative shadow-inner">
                           <div className={`h-full rounded-full ${d.c} transition-all duration-1000 ease-out relative`} style={{width: `${d.v}%`}}>
                              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30"></div>
                           </div>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>

      </div>

      {/* 5. PERSONEL LİSTESİ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <div><h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Users size={20} className="text-slate-500"/> Ekip Listesi</h3><p className="text-xs text-slate-500">Performans dökümü.</p></div>
            <div className="relative w-full sm:w-64"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm font-medium outline-none focus:border-blue-500 transition" placeholder="Personel ara..."/></div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr><th className="px-6 py-4 rounded-tl-lg">Personel</th><th className="px-6 py-4">Departman</th><th className="px-6 py-4 text-center">Durum</th><th className="px-6 py-4 text-center">Görev</th><th className="px-6 py-4 text-center">Verimlilik</th><th className="px-6 py-4 text-center">Puan</th><th className="px-6 py-4 text-right rounded-tr-lg">İşlem</th></tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {loading ? (
                     [...Array(5)].map((_, i) => <TableRowSkeleton key={i}/>)
                  ) : (
                     filteredStaff.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors group animate-in fade-in slide-in-from-bottom-2 duration-300" style={{animationDelay: `${i*50}ms`}}>
                           <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="relative"><div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">{p.name.substring(0,2).toUpperCase()}</div><div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${p.status==='online'?'bg-green-500':p.status==='busy'?'bg-red-500':'bg-slate-300'}`}></div></div><div><div className="font-bold text-slate-800">{p.name}</div><div className="text-[10px] text-slate-400">ID: #{1000+p.id}</div></div></div></td>
                           <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getRoleColor(p.role)}`}>{p.role}</span></td>
                           <td className="px-6 py-4 text-center"><span className={`text-[10px] font-bold uppercase tracking-wider ${p.status==='online'?'text-green-600':p.status==='busy'?'text-red-500':'text-slate-400'}`}>{p.status==='busy'?'Meşgul':p.status==='online'?'Çevrimiçi':'Çevrimdışı'}</span></td>
                           <td className="px-6 py-4 text-center"><div className="flex flex-col items-center"><span className="font-bold text-slate-700">{p.completed} / {p.tasks}</span><div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${(p.completed/p.tasks)*100}%`}}></div></div></div></td>
                           <td className="px-6 py-4 text-center"><span className="font-mono font-bold text-slate-600">{(p.completed/p.tasks*100).toFixed(0)}%</span></td>
                           <td className="px-6 py-4 text-center"><div className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg border border-yellow-100 font-bold text-xs"><Star size={12} fill="currentColor"/> {p.score}</div></td>
                           <td className="px-6 py-4 text-right"><button className="text-slate-400 hover:text-blue-600 transition p-2 rounded-full hover:bg-blue-50"><MoreHorizontal size={18}/></button></td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* TOAST */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 pointer-events-none z-[110]">
        {toasts.map(t=><div key={t.id} className="pointer-events-auto px-4 py-2 rounded shadow-lg text-sm font-bold text-white bg-slate-900 animate-in slide-in-from-right">{t.message}</div>)}
      </div>

    </div>
  );
};

export default StaffReport;