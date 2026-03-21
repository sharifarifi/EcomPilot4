import React, { useState, useEffect } from 'react';
import { 
  Building, Mail, Globe, Save, Upload, Image, 
  Palette, Smartphone, MapPin, Hash, RefreshCw, AlertCircle, Loader2
} from 'lucide-react';
// Yeni servisimiz
import { saveGeneralSettings, subscribeToGeneralSettings } from '../../../firebase/generalSettingsService';

const GeneralSettings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  
  // Varsayılan boş veriler
  const [formData, setFormData] = useState({
    companyName: '', slogan: '', email: '', phone: '',
    website: '', address: '', currency: 'TRY',
    language: 'tr', timezone: 'Europe/Istanbul',
    taxNumber: '', taxOffice: ''
  });

  // Veritabanı Bağlantısı
  useEffect(() => {
    const unsubscribe = subscribeToGeneralSettings((data) => {
      if (data) {
        setFormData(prev => ({ ...prev, ...data }));
        if (data.logoUrl) setLogoPreview(data.logoUrl); // Logo URL varsa göster
      }
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        // Not: Gerçek uygulamada Storage'a yükleyip URL almak gerekir.
        // Şimdilik base64 string olarak kaydediyoruz (küçük logolar için sorun olmaz).
        setFormData(prev => ({ ...prev, logoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveGeneralSettings(formData);
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      alert("Hata: " + error.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div><h3 className="text-2xl font-black text-slate-800 tracking-tight">Genel Ayarlar</h3><p className="text-sm text-slate-500">Firma kimliği, iletişim bilgileri ve sistem tercihlerinizi yapılandırın.</p></div>
        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-lg disabled:opacity-70">
          {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
          {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg"><Building size={20} className="text-blue-600"/> Firma Kimliği</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Firma Adı</label><input name="companyName" value={formData.companyName} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition"/></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Slogan</label><input name="slogan" value={formData.slogan} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:border-blue-500 transition"/></div>
              </div>
              <div className="flex flex-col justify-center">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Firma Logosu</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer group relative overflow-hidden bg-slate-50/50">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleLogoChange} accept="image/*" />
                  {logoPreview ? <img src={logoPreview} alt="Logo" className="h-16 object-contain mb-2" /> : <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><Image size={24}/></div>}
                  <p className="text-sm font-bold text-slate-700">{logoPreview ? 'Logoyu Değiştir' : 'Logo Yükle'}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
               <div><label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Vergi Dairesi</label><div className="relative"><Building size={16} className="absolute left-3 top-3 text-slate-400"/><input name="taxOffice" value={formData.taxOffice} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"/></div></div>
               <div><label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Vergi Numarası</label><div className="relative"><Hash size={16} className="absolute left-3 top-3 text-slate-400"/><input name="taxNumber" value={formData.taxNumber} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-medium outline-none focus:border-blue-500"/></div></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg"><MapPin size={20} className="text-orange-600"/> İletişim Bilgileri</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
               <div><label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">E-Posta</label><div className="relative"><Mail size={16} className="absolute left-3 top-3 text-slate-400"/><input name="email" value={formData.email} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-500"/></div></div>
               <div><label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Telefon</label><div className="relative"><Smartphone size={16} className="absolute left-3 top-3 text-slate-400"/><input name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-500"/></div></div>
            </div>
            <div className="mb-4"><label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Web Sitesi</label><div className="relative"><Globe size={16} className="absolute left-3 top-3 text-slate-400"/><input name="website" value={formData.website} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-500 text-blue-600"/></div></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Adres</label><textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-500 resize-none"></textarea></div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg"><Globe size={20} className="text-emerald-600"/> Bölgesel Ayarlar</h4>
             <div className="space-y-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Para Birimi</label><select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 bg-white"><option value="TRY">Türk Lirası (₺)</option><option value="USD">Amerikan Doları ($)</option><option value="EUR">Euro (€)</option></select></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Dil</label><select name="language" value={formData.language} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 bg-white"><option value="tr">Türkçe</option><option value="en">English</option></select></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Saat Dilimi</label><select name="timezone" value={formData.timezone} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 bg-white"><option value="Europe/Istanbul">İstanbul (GMT+3)</option><option value="Europe/London">London (GMT+0)</option></select></div>
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg"><Palette size={20} className="text-purple-600"/> Görünüm</h4>
             <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl mb-3 cursor-pointer border border-transparent hover:border-purple-200 transition"><span className="text-sm font-bold text-slate-700">Koyu Mod (Dark Mode)</span><div className="w-10 h-5 bg-slate-300 rounded-full relative"><div className="w-3 h-3 bg-white rounded-full absolute top-1 left-1"></div></div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;