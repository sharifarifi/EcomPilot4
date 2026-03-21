import React, { useState, useEffect } from 'react';
import { 
  Clock, Briefcase, Save, Calendar, 
  DollarSign, Shield, ToggleLeft, ToggleRight, MapPin, RotateCcw
} from 'lucide-react';

// Firebase Servisini İçe Aktarıyoruz
import { saveOperationSettings, subscribeToOperationSettings } from '../../../firebase/operationSettingsService';

// Varsayılan Değerler (Sıfırlama işlemi için sabit tutuyoruz)
const DEFAULT_OPS = {
  // 1. Vardiya
  workStart: '09:00',
  workEnd: '18:00',
  lateTolerance: 15,
  workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 
  
  // 2. Mola
  breakDuration: 60,
  autoDeductBreak: true,
  
  // 3. İzin Politikaları (GELİŞTİRİLMİŞ - KIDEME GÖRE)
  annualLeave1to5: 14,   // 1-5 Yıl Arası
  annualLeave5to15: 20,  // 5-15 Yıl Arası
  annualLeave15plus: 26, // 15 Yıl ve Üzeri
  sickLeave: 10,
  excuseLeave: 5,        // Mazeret İzni eklendi
  carryOver: false, 
  maxRolloverDays: 5,    // İzin devri sınırı
  advanceNoticeDays: 3,  // Önceden bildirim şartı
  
  // 4. Finans & Mesai
  overtimeRateWeekday: 1.5,
  overtimeRateWeekend: 2.0,
  
  // 5. Güvenlik
  reportEditTime: 24,
  ipRestriction: false,
  allowedIP: ''
};

const OperationSettings = () => {
  const [loading, setLoading] = useState(false); // Kayıt işlemi için
  const [dataLoading, setDataLoading] = useState(true); // İlk veri çekme için
  const [toasts, setToasts] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // --- STATE ---
  const [ops, setOps] = useState(DEFAULT_OPS);

  // --- VERİTABANI BAĞLANTISI (Firebase) ---
  useEffect(() => {
    const unsubscribe = subscribeToOperationSettings((data) => {
      if (data) {
        // Gelen veriyi state'e yaz, eksik alan varsa varsayılanlarla tamamla
        setOps({ ...DEFAULT_OPS, ...data });
      }
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- YARDIMCI FONKSİYONLAR ---
  
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Firebase'e kaydet
      await saveOperationSettings(ops);
      
      setHasChanges(false);
      showToast("Operasyon kuralları başarıyla güncellendi!");
    } catch (error) {
      showToast("Hata: " + error.message, "warning");
    }
    setLoading(false);
  };

  const handleReset = () => {
    if(window.confirm("Tüm ayarları varsayılana döndürmek istediğinize emin misiniz?")) {
      setOps(DEFAULT_OPS);
      setHasChanges(true);
      showToast("Ayarlar varsayılana döndürüldü. Kaydetmeyi unutmayın.", "warning");
    }
  };

  const handleChange = (key, value) => {
    if (typeof value === 'number' && value < 0) return;
    setOps(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleDay = (day) => {
    let newDays;
    if (ops.workDays.includes(day)) {
      newDays = ops.workDays.filter(d => d !== day);
    } else {
      newDays = [...ops.workDays, day];
    }
    setOps({ ...ops, workDays: newDays });
    setHasChanges(true);
  };

  const daysMap = [
    { key: 'Mon', label: 'Pzt' }, { key: 'Tue', label: 'Sal' }, { key: 'Wed', label: 'Çar' },
    { key: 'Thu', label: 'Per' }, { key: 'Fri', label: 'Cum' }, { key: 'Sat', label: 'Cmt' },
    { key: 'Sun', label: 'Paz' }
  ];

  // Veri yüklenirken gösterilecek basit loader
  if (dataLoading) {
    return <div className="flex justify-center items-center h-64 text-slate-400">Ayarlar yükleniyor...</div>;
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-10 max-w-6xl">
      
      {/* BAŞLIK */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Operasyon Kuralları</h3>
          <p className="text-sm text-slate-500">Vardiya, izin, mesai ve güvenlik politikalarını yapılandırın.</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleReset}
             className="text-slate-400 hover:text-slate-600 p-2 rounded-lg transition" 
             title="Varsayılana Dön"
           >
              <RotateCcw size={20}/>
           </button>
           <button 
             onClick={handleSave} 
             disabled={loading || !hasChanges}
             className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-lg ${
               hasChanges 
               ? 'bg-slate-900 text-white hover:bg-slate-800' 
               : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
             }`}
           >
             {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18}/>}
             {loading ? 'Kaydediliyor...' : 'Kuralları Kaydet'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         
         {/* 1. KART: MESAİ & VARDİYA */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
               <Clock size={20} className="text-blue-500"/> Mesai Saatleri ve Günleri
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Başlangıç</label>
                  <input type="time" className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-slate-50 font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition" value={ops.workStart} onChange={e=>handleChange('workStart', e.target.value)}/>
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bitiş</label>
                  <input type="time" className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-slate-50 font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition" value={ops.workEnd} onChange={e=>handleChange('workEnd', e.target.value)}/>
               </div>
            </div>

            <div>
               <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Çalışma Günleri</label>
               <div className="flex gap-2 flex-wrap">
                  {daysMap.map(day => (
                     <button 
                        key={day.key}
                        onClick={() => toggleDay(day.key)}
                        className={`w-10 h-10 rounded-lg text-xs font-bold transition-all border ${
                          ops.workDays.includes(day.key) 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                          : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                        }`}
                     >
                        {day.label}
                     </button>
                  ))}
               </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
               <div>
                  <span className="text-sm font-bold text-slate-800 block">Geç Kalma Toleransı</span>
                  <span className="text-xs text-blue-600">Giriş saatinden sonraki esneklik süresi.</span>
               </div>
               <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-200">
                  <input 
                    type="number" 
                    min="0"
                    className="w-12 text-center font-bold text-slate-700 outline-none" 
                    value={ops.lateTolerance} 
                    onChange={e=>handleChange('lateTolerance', Number(e.target.value))}
                  />
                  <span className="text-xs text-slate-400 font-bold border-l pl-2 border-slate-200">Dk</span>
               </div>
            </div>
         </div>

         {/* 2. KART: MOLA & FAZLA MESAİ */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
               <DollarSign size={20} className="text-green-500"/> Mola ve Fazla Mesai
            </h4>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <div>
                     <label className="text-sm font-bold text-slate-700 block">Günlük Mola Hakkı</label>
                     <p className="text-xs text-slate-400">Toplam dinlenme süresi.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                     <input type="number" min="0" className="w-12 bg-transparent text-center font-bold text-slate-700 outline-none" value={ops.breakDuration} onChange={e=>handleChange('breakDuration', Number(e.target.value))}/>
                     <span className="text-xs text-slate-400 font-bold border-l pl-2 border-slate-300">Dk</span>
                  </div>
               </div>

               <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer select-none" onClick={() => handleChange('autoDeductBreak', !ops.autoDeductBreak)}>
                  <span className="text-sm font-medium text-slate-600">Molayı çalışma süresinden otomatik düş</span>
                  {ops.autoDeductBreak ? <ToggleRight size={28} className="text-green-500"/> : <ToggleLeft size={28} className="text-slate-300"/>}
               </div>

               <div className="border-t border-slate-100 my-4 pt-4">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Fazla Mesai Çarpanları (Maaş Etkisi)</label>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <span className="text-xs text-slate-400 mb-1 block">Hafta İçi</span>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus-within:border-blue-400 focus-within:bg-white transition">
                           <span className="text-slate-400 font-bold">x</span>
                           <input type="number" step="0.1" min="1" className="w-full bg-transparent font-bold text-slate-700 outline-none" value={ops.overtimeRateWeekday} onChange={e=>handleChange('overtimeRateWeekday', Number(e.target.value))}/>
                        </div>
                     </div>
                     <div>
                        <span className="text-xs text-slate-400 mb-1 block">Hafta Sonu / Tatil</span>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus-within:border-blue-400 focus-within:bg-white transition">
                           <span className="text-slate-400 font-bold">x</span>
                           <input type="number" step="0.1" min="1" className="w-full bg-transparent font-bold text-slate-700 outline-none" value={ops.overtimeRateWeekend} onChange={e=>handleChange('overtimeRateWeekend', Number(e.target.value))}/>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* 3. KART: İZİN POLİTİKALARI (TÜRKİYE İŞ KANUNUNA GÖRE GÜNCELLENDİ) */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 xl:col-span-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
               <Calendar size={20} className="text-purple-500"/> İzin Politikaları (İş Kanunu Uyumlu)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* 1-5 Yıl Kıdem */}
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                     <label className="text-xs font-bold text-slate-500 uppercase block">1 - 5 Yıl Kıdem</label>
                     <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded font-bold">Asgari: 14</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 focus-within:border-purple-500 transition">
                     <input type="number" min="14" className="w-full text-sm font-bold text-slate-700 outline-none" value={ops.annualLeave1to5} onChange={e=>handleChange('annualLeave1to5', Number(e.target.value))}/>
                     <span className="text-xs text-slate-400 font-bold">Gün</span>
                  </div>
               </div>

               {/* 5-15 Yıl Kıdem */}
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                     <label className="text-xs font-bold text-slate-500 uppercase block">5 - 15 Yıl Kıdem</label>
                     <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded font-bold">Asgari: 20</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 focus-within:border-purple-500 transition">
                     <input type="number" min="20" className="w-full text-sm font-bold text-slate-700 outline-none" value={ops.annualLeave5to15} onChange={e=>handleChange('annualLeave5to15', Number(e.target.value))}/>
                     <span className="text-xs text-slate-400 font-bold">Gün</span>
                  </div>
               </div>

               {/* 15+ Yıl Kıdem */}
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                     <label className="text-xs font-bold text-slate-500 uppercase block">15+ Yıl Kıdem</label>
                     <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded font-bold">Asgari: 26</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 focus-within:border-purple-500 transition">
                     <input type="number" min="26" className="w-full text-sm font-bold text-slate-700 outline-none" value={ops.annualLeave15plus} onChange={e=>handleChange('annualLeave15plus', Number(e.target.value))}/>
                     <span className="text-xs text-slate-400 font-bold">Gün</span>
                  </div>
               </div>
            </div>

            {/* Diğer İzin Hakları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
               <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700">Hastalık İzni Hakkı</label>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 w-24">
                     <input type="number" min="0" className="w-full bg-transparent text-center font-bold text-slate-700 outline-none" value={ops.sickLeave} onChange={e=>handleChange('sickLeave', Number(e.target.value))}/>
                     <span className="text-xs text-slate-400 font-bold">Gün</span>
                  </div>
               </div>
               
               <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700">Mazeret İzni Hakkı</label>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 w-24">
                     <input type="number" min="0" className="w-full bg-transparent text-center font-bold text-slate-700 outline-none" value={ops.excuseLeave} onChange={e=>handleChange('excuseLeave', Number(e.target.value))}/>
                     <span className="text-xs text-slate-400 font-bold">Gün</span>
                  </div>
               </div>
            </div>

            {/* İzin Kuralları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
               <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => handleChange('carryOver', !ops.carryOver)}>
                     <div>
                        <span className="text-sm font-bold text-purple-900 block">İzin Devri</span>
                        <p className="text-xs text-purple-600 mt-0.5">Kullanılmayan izinler devredilsin.</p>
                     </div>
                     {ops.carryOver ? <ToggleRight size={32} className="text-purple-600"/> : <ToggleLeft size={32} className="text-purple-300"/>}
                  </div>
                  {ops.carryOver && (
                     <div className="flex justify-between items-center pt-3 border-t border-purple-200/50">
                        <span className="text-xs font-bold text-purple-800">Maksimum Devir Sınırı</span>
                        <div className="flex items-center gap-1">
                           <input type="number" min="0" className="w-12 bg-white border border-purple-200 rounded p-1 text-center text-sm font-bold outline-none focus:border-purple-500" value={ops.maxRolloverDays} onChange={e=>handleChange('maxRolloverDays', Number(e.target.value))}/>
                           <span className="text-xs font-bold text-purple-600">Gün</span>
                        </div>
                     </div>
                  )}
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                     <span className="text-sm font-bold text-slate-700 block">Önceden Bildirim Şartı</span>
                     <p className="text-xs text-slate-500 mt-0.5">İzin en az kaç gün önce istenmeli.</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white border border-slate-300 px-2 py-1 rounded-lg">
                     <input type="number" min="0" className="w-10 text-center text-sm font-bold outline-none" value={ops.advanceNoticeDays} onChange={e=>handleChange('advanceNoticeDays', Number(e.target.value))}/>
                     <span className="text-xs text-slate-400 font-bold">Gün</span>
                  </div>
               </div>
            </div>
         </div>

         {/* 4. KART: GÜVENLİK & KISITLAMALAR */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 xl:col-span-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
               <Shield size={20} className="text-red-500"/> Güvenlik ve Kısıtlamalar
            </h4>

            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Rapor Düzenleme Süresi (Saat)</label>
                  <div className="flex items-center gap-2">
                     <input type="number" min="0" className="flex-1 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition" value={ops.reportEditTime} onChange={e=>handleChange('reportEditTime', Number(e.target.value))}/>
                     <span className="text-xs text-slate-400 w-1/2 leading-tight">Personel oluşturduğu raporu bu süreden sonra düzenleyemez.</span>
                  </div>
               </div>

               <div className="pt-2">
                  <div className="flex items-center justify-between mb-3 cursor-pointer select-none" onClick={() => handleChange('ipRestriction', !ops.ipRestriction)}>
                     <span className="text-sm font-bold text-slate-700">IP Kısıtlaması (Sadece Ofisten Giriş)</span>
                     <div>
                        {ops.ipRestriction ? <ToggleRight size={28} className="text-red-500"/> : <ToggleLeft size={28} className="text-slate-300"/>}
                     </div>
                  </div>
                  
                  <div className={`transition-all duration-300 overflow-hidden ${ops.ipRestriction ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><MapPin size={12}/> İzin Verilen IP Adresi</label>
                     <input 
                        type="text" 
                        className="w-full border border-red-200 bg-red-50 rounded-lg p-3 text-sm outline-none text-red-800 font-mono focus:border-red-400 focus:bg-white transition" 
                        value={ops.allowedIP} 
                        onChange={e=>handleChange('allowedIP', e.target.value)}
                        placeholder="Örn: 192.168.1.1"
                     />
                  </div>
               </div>
            </div>
         </div>

      </div>

      {/* TOAST NOTIFICATION */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 pointer-events-none z-[110]">
        {toasts.map(t=><div key={t.id} className={`pointer-events-auto px-4 py-2 rounded shadow-lg text-sm font-bold text-white ${t.type==='warning'?'bg-orange-500':'bg-slate-900'}`}>{t.message}</div>)}
      </div>

    </div>
  );
};

export default OperationSettings;
