import React, { useState, useEffect } from 'react';
import { 
  Save, Instagram, Store, Package, 
  Target, Zap, Crown, Percent, CheckCircle2, 
  Plus, Trash2, Loader2, AlertTriangle, Truck, User
} from 'lucide-react';

// Firebase Servisi
import { saveCommissionSettings, subscribeToCommissionSettings } from '../../../firebase/commissionSettingsService';

// --- VARSAYILAN VERİLER ---
const DEFAULT_SOCIAL = {
  monthlyTarget: 1000000,
  leaderBonus: 0.25,
  isLeaderBonusActive: true,
  tiers: [
    { min: 80, max: 89.99, rate: 0.10 },
    { min: 90, max: 99.99, rate: 0.15 },
    { min: 100, max: 109.99, rate: 0.20 },
    { min: 110, max: 9999, rate: 0.30 },
  ],
  manualBonuses: [
    { minRatio: 20, maxRatio: 24.99, extraRate: 0.25 },
    { minRatio: 25, maxRatio: 29.99, extraRate: 0.30 },
    { minRatio: 30, maxRatio: 100, extraRate: 0.50 },
  ]
};

const DEFAULT_RETAIL = {
  storeTarget: 1500000,
  defaultPersonalTarget: 200000, // YENİ EKLENDİ
  storeBonusAmount: 1000,
  tiers: [
    { min: 80, rate: 1.0 },
    { min: 100, rate: 2.0 },
    { min: 120, rate: 3.0 },
  ]
};

const DEFAULT_OPERATION = {
  perPackageRate: 2.50,
  errorPenalty: 50,
  zeroErrorBonus: 500,
  minPackageTarget: 1000
};

const CommissionSettings = () => {
  const [activeTab, setActiveTab] = useState('social'); 
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- STATE ---
  const [socialConfig, setSocialConfig] = useState(DEFAULT_SOCIAL);
  const [retailConfig, setRetailConfig] = useState(DEFAULT_RETAIL);
  const [operationConfig, setOperationConfig] = useState(DEFAULT_OPERATION);

  useEffect(() => {
    const unsubscribe = subscribeToCommissionSettings((data) => {
      if (data) {
        if (data.social) setSocialConfig(data.social);
        // defaultPersonalTarget veritabanında yoksa varsayılanı kullan (Eski verileri bozmamak için)
        if (data.retail) setRetailConfig({ ...DEFAULT_RETAIL, ...data.retail });
        if (data.operation) setOperationConfig(data.operation);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveCommissionSettings({
        social: socialConfig,
        retail: retailConfig,
        operation: operationConfig
      });
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      alert("Hata: " + error.message);
      setIsSaving(false);
    }
  };

  // HELPER FONKSİYONLAR (Aynı)
  const updateSocialTier = (index, field, value) => {
    const newTiers = [...socialConfig.tiers];
    newTiers[index][field] = Number(value);
    setSocialConfig({ ...socialConfig, tiers: newTiers });
  };
  const addSocialTier = () => setSocialConfig({...socialConfig, tiers: [...socialConfig.tiers, { min: 0, max: 0, rate: 0 }]});
  const removeSocialTier = (index) => setSocialConfig({...socialConfig, tiers: socialConfig.tiers.filter((_, i) => i !== index)});
  const updateManualBonus = (index, field, value) => {
    const newBonuses = [...socialConfig.manualBonuses];
    newBonuses[index][field] = Number(value);
    setSocialConfig({ ...socialConfig, manualBonuses: newBonuses });
  };
  const updateRetailTier = (index, field, value) => {
    const newTiers = [...retailConfig.tiers];
    newTiers[index][field] = Number(value);
    setRetailConfig({ ...retailConfig, tiers: newTiers });
  };

  const SettingCard = ({ title, description, children, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <div className="flex items-start gap-4 mb-6 border-b border-slate-100 pb-4">
        <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 border border-${color}-100`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );

  if (loading) return <div className="flex justify-center items-center h-64 text-slate-400"><Loader2 className="animate-spin mr-2"/> Kurallar yükleniyor...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div><h3 className="text-2xl font-black text-slate-800">Prim Yönetimi</h3><p className="text-sm text-slate-500">Tüm departmanların hakediş kurallarını yapılandırın.</p></div>
        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-lg disabled:opacity-70">
          {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}{isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>

      <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-xl border border-slate-200 w-fit">
        {[{ id: 'social', label: 'Sosyal Medya', icon: Instagram }, { id: 'retail', label: 'Mağaza Satış', icon: Store }, { id: 'operation', label: 'Operasyon', icon: Package }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}><tab.icon size={18} /> {tab.label}</button>
        ))}
      </div>

      {activeTab === 'social' && (
        <div className="space-y-6 animate-in fade-in">
          <SettingCard title="Genel Hedefler" description="Ana ciro hedefi ve liderlik bonusu." icon={Target} color="indigo">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Aylık Ciro Hedefi</label><div className="relative"><div className="absolute left-3 top-3 text-slate-400 font-bold">₺</div><input type="number" className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition" value={socialConfig.monthlyTarget} onChange={(e) => setSocialConfig({...socialConfig, monthlyTarget: Number(e.target.value)})}/></div></div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><div className="flex justify-between items-center mb-3"><label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1"><Crown size={14}/> Lider Bonusu</label><input type="checkbox" checked={socialConfig.isLeaderBonusActive} onChange={() => setSocialConfig({...socialConfig, isLeaderBonusActive: !socialConfig.isLeaderBonusActive})} className="w-5 h-5 accent-indigo-600"/></div><div className="relative"><input type="number" disabled={!socialConfig.isLeaderBonusActive} className="w-full pr-8 pl-4 py-2 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 disabled:bg-slate-100" value={socialConfig.leaderBonus} onChange={(e) => setSocialConfig({...socialConfig, leaderBonus: Number(e.target.value)})}/><div className="absolute right-3 top-2 text-slate-400 font-bold">%</div></div></div>
            </div>
          </SettingCard>
          <SettingCard title="Ciro Bazlı Prim Basamakları" description="Toplam ciro hedefine ulaşma yüzdesine göre prim." icon={Percent} color="blue">
            <div className="overflow-hidden border border-slate-200 rounded-xl"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase"><tr><th className="px-4 py-3">Min Başarı (%)</th><th className="px-4 py-3">Max Başarı (%)</th><th className="px-4 py-3 text-right">Prim Oranı (%)</th><th className="px-4 py-3 text-center">İşlem</th></tr></thead><tbody className="divide-y divide-slate-100">{socialConfig.tiers.map((tier, i) => (<tr key={i} className="hover:bg-slate-50"><td className="px-4 py-2"><input type="number" value={tier.min} onChange={(e) => updateSocialTier(i, 'min', e.target.value)} className="w-20 p-1 border border-slate-200 rounded text-center font-medium outline-none focus:border-blue-500"/></td><td className="px-4 py-2"><input type="number" value={tier.max} onChange={(e) => updateSocialTier(i, 'max', e.target.value)} className="w-20 p-1 border border-slate-200 rounded text-center font-medium outline-none focus:border-blue-500"/></td><td className="px-4 py-2 text-right"><div className="flex justify-end items-center gap-1"><input type="number" step="0.01" value={tier.rate} onChange={(e) => updateSocialTier(i, 'rate', e.target.value)} className="w-16 p-1 border border-slate-200 rounded text-center font-bold text-blue-600 outline-none focus:border-blue-500 bg-blue-50"/><span className="text-slate-400">%</span></div></td><td className="px-4 py-2 text-center"><button onClick={() => removeSocialTier(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button></td></tr>))}</tbody></table><button onClick={addSocialTier} className="w-full py-2 bg-slate-50 text-slate-500 font-bold text-xs hover:bg-slate-100 transition flex items-center justify-center gap-1 border-t border-slate-200"><Plus size={14}/> Yeni Basamak Ekle</button></div>
          </SettingCard>
          <SettingCard title="Manuel Satış Bonusları" description="Manuel sipariş oranına göre ekstra bonuslar." icon={Zap} color="orange">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{socialConfig.manualBonuses.map((bonus, i) => (<div key={i} className="p-4 border border-slate-200 rounded-xl bg-white relative"><div className="absolute top-0 left-0 w-1 h-full bg-orange-400 rounded-l-xl"></div><div className="mb-3"><label className="text-[10px] font-bold text-slate-400 uppercase">Manuel Oran Aralığı</label><div className="flex items-center gap-2 mt-1"><input type="number" value={bonus.minRatio} onChange={(e) => updateManualBonus(i, 'minRatio', e.target.value)} className="w-12 p-1 border border-slate-200 rounded text-center font-bold text-slate-700"/><span className="text-slate-400">-</span><input type="number" value={bonus.maxRatio} onChange={(e) => updateManualBonus(i, 'maxRatio', e.target.value)} className="w-12 p-1 border border-slate-200 rounded text-center font-bold text-slate-700"/><span className="text-slate-400 font-bold">%</span></div></div><div><label className="text-[10px] font-bold text-slate-400 uppercase">Ekstra Bonus</label><div className="flex items-center gap-1 mt-1"><span className="text-lg font-bold text-orange-600">+</span><input type="number" step="0.01" value={bonus.extraRate} onChange={(e) => updateManualBonus(i, 'extraRate', e.target.value)} className="w-full p-1.5 border border-orange-100 bg-orange-50 rounded text-center font-black text-orange-600"/><span className="text-orange-600 font-bold">%</span></div></div></div>))}</div>
          </SettingCard>
        </div>
      )}

      {activeTab === 'retail' && (
        <div className="space-y-6 animate-in fade-in">
           <SettingCard title="Mağaza Genel Ayarları" description="Mağaza hedefleri ve bireysel kotalar." icon={Store} color="emerald">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> {/* Grid 3'e çıkarıldı */}
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Mağaza Toplam Ciro Hedefi</label>
                    <div className="relative">
                       <div className="absolute left-3 top-3 text-slate-400 font-bold">₺</div>
                       <input type="number" className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 transition" value={retailConfig.storeTarget} onChange={(e) => setRetailConfig({...retailConfig, storeTarget: Number(e.target.value)})}/>
                    </div>
                 </div>
                 
                 {/* YENİ EKLENEN ALAN */}
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1"><User size={14}/> Varsayılan Bireysel Hedef</label>
                    <div className="relative">
                       <div className="absolute left-3 top-3 text-slate-400 font-bold">₺</div>
                       <input type="number" className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 transition bg-emerald-50/30" value={retailConfig.defaultPersonalTarget} onChange={(e) => setRetailConfig({...retailConfig, defaultPersonalTarget: Number(e.target.value)})}/>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Personel için başlangıç hedefi olarak atanır.</p>
                 </div>

                 <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <label className="text-xs font-bold text-emerald-800 uppercase mb-2 block flex items-center gap-1"><CheckCircle2 size={14}/> Takım Bonusu (Kişi Başı)</label>
                    <div className="relative">
                       <div className="absolute left-3 top-3 text-emerald-600 font-bold">₺</div>
                       <input type="number" className="w-full pl-8 pr-4 py-2 border border-emerald-200 bg-white rounded-lg font-bold text-emerald-700 outline-none focus:border-emerald-500" value={retailConfig.storeBonusAmount} onChange={(e) => setRetailConfig({...retailConfig, storeBonusAmount: Number(e.target.value)})}/>
                    </div>
                    <p className="text-[10px] text-emerald-600 mt-2">Mağaza hedefi tutarsa personele eklenecek.</p>
                 </div>
              </div>
           </SettingCard>

           <SettingCard title="Bireysel Performans Oranları" description="Bireysel hedefi tutturma oranına göre prim yüzdeleri." icon={Percent} color="blue">
              <div className="flex flex-col gap-4">
                 {retailConfig.tiers.map((tier, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition bg-white">
                       <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">{i+1}</div>
                       <div className="flex-1 grid grid-cols-2 gap-4">
                          <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Min. Başarı Oranı</label><div className="relative"><input type="number" value={tier.min} onChange={(e) => updateRetailTier(i, 'min', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-500"/><span className="absolute right-3 top-2 text-slate-400 font-bold text-sm">%</span></div></div>
                          <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Prim Oranı</label><div className="relative"><input type="number" step="0.1" value={tier.rate} onChange={(e) => updateRetailTier(i, 'rate', e.target.value)} className="w-full p-2 border border-blue-100 bg-blue-50 rounded-lg text-sm font-bold text-blue-700 outline-none focus:border-blue-500"/><span className="absolute right-3 top-2 text-blue-400 font-bold text-sm">%</span></div></div>
                       </div>
                    </div>
                 ))}
              </div>
           </SettingCard>
        </div>
      )}

      {activeTab === 'operation' && (
         <div className="space-y-6 animate-in fade-in">
            <SettingCard title="Paketleme ve Lojistik Ücretleri" description="Depo personeli paket başı hakediş." icon={Truck} color="amber">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Paket Başı Ücret</label><div className="relative"><div className="absolute left-3 top-3 text-slate-400 font-bold">₺</div><input type="number" step="0.1" className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-amber-500 transition" value={operationConfig.perPackageRate} onChange={(e) => setOperationConfig({...operationConfig, perPackageRate: Number(e.target.value)})}/></div></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Min. Paket Kotası</label><div className="relative"><Package size={16} className="absolute left-3 top-3.5 text-slate-400"/><input type="number" className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-amber-500 transition" value={operationConfig.minPackageTarget} onChange={(e) => setOperationConfig({...operationConfig, minPackageTarget: Number(e.target.value)})}/></div></div>
               </div>
            </SettingCard>
            <SettingCard title="Kalite ve Hata Politikası" description="Cezalar ve hatasızlık ödülleri." icon={AlertTriangle} color="red">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100"><label className="text-xs font-bold text-red-800 uppercase mb-2 block">Hata Başına Ceza</label><div className="relative"><div className="absolute left-3 top-2 text-red-600 font-bold">₺</div><input type="number" className="w-full pl-8 pr-4 py-2 border border-red-200 bg-white rounded-lg font-bold text-red-700 outline-none focus:border-red-500" value={operationConfig.errorPenalty} onChange={(e) => setOperationConfig({...operationConfig, errorPenalty: Number(e.target.value)})}/></div></div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100"><label className="text-xs font-bold text-emerald-800 uppercase mb-2 block">Hatasızlık Bonusu</label><div className="relative"><div className="absolute left-3 top-2 text-emerald-600 font-bold">₺</div><input type="number" className="w-full pl-8 pr-4 py-2 border border-emerald-200 bg-white rounded-lg font-bold text-emerald-700 outline-none focus:border-emerald-500" value={operationConfig.zeroErrorBonus} onChange={(e) => setOperationConfig({...operationConfig, zeroErrorBonus: Number(e.target.value)})}/></div></div>
               </div>
            </SettingCard>
         </div>
      )}
    </div>
  );
};

export default CommissionSettings;