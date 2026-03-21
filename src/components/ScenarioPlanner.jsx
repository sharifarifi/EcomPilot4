import React, { useState, useEffect } from 'react';
import { RefreshCw, Save, Upload, Download, Calendar, FileSpreadsheet } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

const ScenarioPlanner = () => {
  // 1. STATE YAPISI
  const [scenarioDate, setScenarioDate] = useState('2024-04'); // Varsayılan Başlangıç
  const [inputs, setInputs] = useState({
    marketingBudget: 50000,
    cpc: 2.5,
    conversionRate: 2.5,
    aov: 850,
    cogsRate: 40,
    shippingAvg: 35,
    returnRate: 15,
    fixedCost: 20000
  });

  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({ revenue: 0, profit: 0, margin: 0 });

  // 2. EXCEL İŞLEMLERİ
  
  // Excel Şablonu İndir
  const downloadTemplate = () => {
    const templateData = [
      { 
        "Parametre": "marketingBudget", "Değer": 50000, "Açıklama": "Aylık Reklam Bütçesi" 
      },
      { "Parametre": "cpc", "Değer": 2.5, "Açıklama": "Tıklama Başı Maliyet" },
      { "Parametre": "conversionRate", "Değer": 2.5, "Açıklama": "Dönüşüm Oranı (%)" },
      { "Parametre": "aov", "Değer": 850, "Açıklama": "Sepet Ortalaması" },
      { "Parametre": "cogsRate", "Değer": 40, "Açıklama": "Ürün Maliyeti (%)" },
      { "Parametre": "shippingAvg", "Değer": 35, "Açıklama": "Kargo Maliyeti" },
      { "Parametre": "returnRate", "Değer": 15, "Açıklama": "İade Oranı (%)" },
      { "Parametre": "fixedCost", "Değer": 20000, "Açıklama": "Sabit Giderler" }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sablon");
    XLSX.writeFile(wb, "Senaryo_Sablonu.xlsx");
  };

  // Excel Yükle ve Oku
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const bstr = event.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      // Excel verisini state'e dönüştür
      const newInputs = { ...inputs };
      data.forEach(row => {
        if(newInputs.hasOwnProperty(row.Parametre)) {
           newInputs[row.Parametre] = parseFloat(row.Değer);
        }
      });
      setInputs(newInputs);
      alert("Excel verileri başarıyla yüklendi!");
    };
    reader.readAsBinaryString(file);
  };

  // 3. HESAPLAMA MOTORU (Tarih Seçimine Göre Dinamik)
  useEffect(() => {
    const [year, month] = scenarioDate.split('-').map(Number);
    let currentData = new Date(year, month - 1, 1); // JS'de aylar 0'dan başlar

    let totalRev = 0;
    let totalProf = 0;

    const newResults = Array.from({ length: 6 }).map((_, index) => {
      // Ay İsimlerini Oluştur
      const monthName = currentData.toLocaleDateString('tr-TR', { month: 'long', year: '2-digit' });
      currentData.setMonth(currentData.getMonth() + 1); // Bir sonraki aya geç

      const growthFactor = 1 + (index * 0.10); 
      const monthlyBudget = inputs.marketingBudget * growthFactor;
      const traffic = monthlyBudget / inputs.cpc;
      let orders = traffic * (inputs.conversionRate / 100);
      const netOrders = orders * (1 - inputs.returnRate / 100);
      const revenue = netOrders * inputs.aov;
      const cogs = revenue * (inputs.cogsRate / 100); 
      const shippingCost = orders * inputs.shippingAvg; 
      const totalVariableCost = cogs + shippingCost + monthlyBudget;
      const profit = revenue - totalVariableCost - inputs.fixedCost;
      const margin = (revenue > 0) ? (profit / revenue) * 100 : 0;

      totalRev += revenue;
      totalProf += profit;

      return {
        month: monthName,
        revenue,
        traffic: Math.round(traffic),
        netOrders: Math.round(netOrders),
        marketingCost: monthlyBudget,
        totalCost: totalVariableCost + inputs.fixedCost,
        profit,
        margin
      };
    });

    setResults(newResults);
    setSummary({
      revenue: totalRev,
      profit: totalProf,
      margin: totalRev > 0 ? (totalProf / totalRev) * 100 : 0
    });

  }, [inputs, scenarioDate]); // Tarih veya Input değişince çalışır

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const fmt = (num) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* SOL PANEL: KONTROL MERKEZİ */}
      <div className="w-full lg:w-1/4 bg-white p-5 rounded-xl shadow-lg border border-slate-200 overflow-y-auto custom-scrollbar flex flex-col">
        
        {/* Üst Araç Çubuğu (Toolbar) */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Senaryo Ayarları</h2>
            <button onClick={() => window.location.reload()} title="Sıfırla">
              <RefreshCw size={16} className="text-slate-400 hover:text-blue-600"/>
            </button>
          </div>

          {/* Tarih Seçimi */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center gap-2">
             <Calendar size={18} className="text-slate-400"/>
             <div className="flex-1">
               <label className="text-[10px] font-bold text-slate-500 uppercase block">Başlangıç Dönemi</label>
               <input 
                 type="month" 
                 value={scenarioDate} 
                 onChange={(e) => setScenarioDate(e.target.value)}
                 className="bg-transparent font-bold text-slate-700 w-full outline-none text-sm"
               />
             </div>
          </div>

          {/* Excel Butonları */}
          <div className="flex gap-2">
            <button onClick={downloadTemplate} className="flex-1 bg-green-50 text-green-700 border border-green-200 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-100 transition">
               <FileSpreadsheet size={14}/> Şablon İndir
            </button>
            <label className="flex-1 bg-blue-50 text-blue-700 border border-blue-200 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-100 transition cursor-pointer">
               <Upload size={14}/> Excel Yükle
               <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* INPUT ALANLARI (Hibrit: Slider + Manuel) */}
        <div className="space-y-4 flex-1">
          <DriverGroup title="Büyüme" color="blue">
              <DriverInput label="Reklam Bütçesi" name="marketingBudget" value={inputs.marketingBudget} onChange={handleInputChange} min={5000} max={500000} step={1000} suffix="₺"/>
              <DriverInput label="Tıklama Maliyeti (CPC)" name="cpc" value={inputs.cpc} onChange={handleInputChange} min={0.1} max={20} step={0.1} suffix="₺"/>
              <DriverInput label="Dönüşüm Oranı (CR)" name="conversionRate" value={inputs.conversionRate} onChange={handleInputChange} min={0.1} max={10} step={0.1} suffix="%"/>
          </DriverGroup>

          <DriverGroup title="Operasyon" color="slate">
               <DriverInput label="Ort. Sepet (AOV)" name="aov" value={inputs.aov} onChange={handleInputChange} min={100} max={5000} step={50} suffix="₺"/>
               <DriverInput label="Ürün Maliyeti (%)" name="cogsRate" value={inputs.cogsRate} onChange={handleInputChange} min={10} max={90} step={1} suffix="%"/>
               <DriverInput label="Kargo Maliyeti" name="shippingAvg" value={inputs.shippingAvg} onChange={handleInputChange} min={10} max={200} step={5} suffix="₺"/>
          </DriverGroup>

           <DriverGroup title="Risk & Sabit" color="red">
               <DriverInput label="İade Oranı" name="returnRate" value={inputs.returnRate} onChange={handleInputChange} min={0} max={50} step={1} suffix="%"/>
               <DriverInput label="Sabit Gider" name="fixedCost" value={inputs.fixedCost} onChange={handleInputChange} min={0} max={200000} step={1000} suffix="₺"/>
          </DriverGroup>
        </div>
      </div>

      {/* SAĞ PANEL: AYNI KALDI (GRAFİK VE TABLO) */}
      <div className="flex-1 flex flex-col gap-6">
        {/* ÖZET KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <SummaryCard title="Toplam Ciro" value={fmt(summary.revenue)} color="blue" />
           <SummaryCard title="Toplam Net Kâr" value={fmt(summary.profit)} color={summary.profit > 0 ? "green" : "red"} />
           <SummaryCard title="Ort. Kâr Marjı" value={`%${summary.margin.toFixed(1)}`} color={summary.margin > 15 ? "green" : "orange"} />
        </div>

        {/* GRAFİK VE TABLO KAPSAYICI */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="h-48 p-4 border-b border-slate-100 bg-slate-50/50">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={results}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} formatter={(value) => fmt(value)}/>
                <Area type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-500 font-bold uppercase text-xs sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="px-4 py-3 bg-slate-50">Ay</th>
                  <th className="px-4 py-3 bg-slate-50">Trafik</th>
                  <th className="px-4 py-3 bg-slate-50">Satış</th>
                  <th className="px-4 py-3 bg-slate-50 text-blue-600">Ciro</th>
                  <th className="px-4 py-3 bg-slate-50 text-red-500">Giderler</th>
                  <th className="px-4 py-3 bg-blue-50 text-blue-800 border-l border-blue-100">Net Kâr</th>
                  <th className="px-4 py-3 bg-slate-50">Marj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{row.month}</td>
                    <td className="px-4 py-3 text-slate-500">{row.traffic.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500">{row.netOrders}</td>
                    <td className="px-4 py-3 font-bold text-blue-600">{fmt(row.revenue)}</td>
                    <td className="px-4 py-3 text-red-400">{fmt(row.totalCost)}</td>
                    <td className={`px-4 py-3 font-bold border-l border-slate-100 ${row.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(row.profit)}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">%{row.margin.toFixed(1)}</td>
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

// --- YARDIMCI BİLEŞENLER ---

const DriverGroup = ({ title, color, children }) => (
  <div className={`p-3 bg-${color}-50 rounded-lg border border-${color}-100`}>
    <h3 className={`text-xs font-bold text-${color}-800 uppercase mb-3`}>{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const DriverInput = ({ label, name, value, onChange, min, max, step, suffix }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      {/* BURASI YENİ: Elle Giriş Inputu */}
      <div className="flex items-center">
        <input 
          type="number" 
          name={name}
          value={value} 
          onChange={onChange}
          className="w-16 text-right text-xs font-bold text-blue-600 bg-white border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-blue-500"
        />
        <span className="text-[10px] text-slate-400 ml-1 w-3">{suffix}</span>
      </div>
    </div>
    <input 
      type="range" name={name} min={min} max={max} step={step} value={value} onChange={onChange}
      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500"
    />
  </div>
);

const SummaryCard = ({ title, value, color }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <h3 className={`text-2xl font-bold mt-1 text-${color}-600`}>{value}</h3>
  </div>
);

export default ScenarioPlanner;