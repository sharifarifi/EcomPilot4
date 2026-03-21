import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Activity, Megaphone, Package, Users, Tags } from 'lucide-react';

// Sabit veriler (Veritabanı bağlantısı yapınca burası dinamik olacak)
const salesData = [
  { name: 'Pzt', satis: 4000, butce: 2400 },
  { name: 'Sal', satis: 3000, butce: 1398 },
  { name: 'Çar', satis: 9800, butce: 8000 },
  { name: 'Per', satis: 3908, butce: 3908 },
  { name: 'Cum', satis: 4800, butce: 4800 },
  { name: 'Cmt', satis: 3800, butce: 3800 },
  { name: 'Paz', satis: 4300, butce: 4300 },
];

const costData = [
  { name: 'Ürün Maliyeti', value: 400 },
  { name: 'Reklam', value: 300 },
  { name: 'Kargo', value: 100 },
  { name: 'Net Kâr', value: 200 },
];
const COLORS = ['#94a3b8', '#60a5fa', '#f87171', '#34d399'];

// KPICard Bileşeni (Dashboard içinde kullanılıyor)
const KPICard = ({ title, value, trend, icon, isNegative }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-2">{value}</h3>
      </div>
      <div className="p-2 bg-slate-50 rounded-lg">
        {icon}
      </div>
    </div>
    <div className={`mt-3 text-xs font-bold ${isNegative ? 'text-red-500' : 'text-green-500'} flex items-center gap-1`}>
      {trend} 
      <span className="text-slate-400 font-normal"> geçen döneme göre</span>
    </div>
  </div>
);

// Dashboard Bileşeni
const Dashboard = ({ startDate, endDate, compareMode }) => {
  
  // GÜVENLİK KONTROLÜ: Tarihler gelmediyse veya undefined ise varsayılan değerler ata veya loading göster
  if (!startDate || !endDate) {
      return (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="text-center">
                  <div className="text-slate-400 text-sm font-medium mb-2">Veriler Yükleniyor...</div>
                  {/* İstersen buraya bir loader ikonu ekleyebilirsin */}
              </div>
          </div>
      );
  }

  // Tarihleri okunaklı hale getirelim (Örn: 01.03.2024)
  // split hatasını önlemek için güvenli bir şekilde formatla
  const formatDate = (d) => {
      if (!d) return '';
      try {
          return d.split('-').reverse().join('.');
      } catch (e) {
          return d; // Hata olursa orijinal stringi dön
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* SEÇİLEN TARİH BİLGİSİ */}
      <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-blue-800 flex justify-between items-center shadow-sm">
        <span className="flex items-center gap-2">
          <Activity size={16} />
          <strong>Rapor Dönemi:</strong> {formatDate(startDate)} - {formatDate(endDate)}
        </span>
        {compareMode && (
          <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-bold animate-pulse">
            Önceki Dönem ile Kıyaslanıyor
          </span>
        )}
      </div>

      {/* 1. SATIR: FİNANSAL METRİKLER */}
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Finansal Özet</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Toplam Ciro" value="₺145,230" trend="+12%" icon={<DollarSign className="text-blue-600"/>} />
        <KPICard title="Toplam Reklam Gideri" value="₺32,400" trend="+8%" isNegative icon={<Megaphone className="text-pink-500"/>} />
        <KPICard title="Net Kâr" value="₺42,500" trend="+5%" icon={<TrendingUp className="text-green-500"/>} />
        <KPICard title="ROAS" value="4.48x" trend="+0.5" icon={<Activity className="text-orange-500"/>} />
      </div>

      {/* 2. SATIR: OPERASYONEL METRİKLER */}
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Operasyon & Satış</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Toplam Sipariş" value="1,452" trend="+15%" icon={<ShoppingCart className="text-purple-500"/>} />
        <KPICard title="Satılan Ürün Adedi" value="2,105" trend="+18%" icon={<Package className="text-indigo-500"/>} />
        <KPICard title="Dönüşüm Oranı" value="%2.8" trend="-0.1%" isNegative icon={<Users className="text-teal-500"/>} />
        <KPICard title="Ort. Ürün Fiyatı" value="₺480" trend="+20₺" icon={<Tags className="text-yellow-500"/>} />
      </div>

      {/* GRAFİKLER ALANI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96 mt-4">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-4 text-slate-700">Satış Trendi</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorSatis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
              <Area type="monotone" dataKey="satis" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSatis)" />
              {/* Compare Mode açıksa bütçe çizgisini "Geçen Dönem" gibi gösterebiliriz */}
              <Area type="monotone" dataKey="butce" stroke="#94a3b8" strokeDasharray="5 5" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-semibold mb-2 text-slate-700">Maliyet & Kârlılık</h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={costData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {costData.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index]}}></span>
                  {item.name}
                </span>
                <span className="font-bold">%{item.value / 10}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;