import React, { useState } from 'react';
import { Building, Users, Globe, Briefcase, ChevronRight, Settings, Percent } from 'lucide-react';

// ALT BİLEŞENLER (DOSYA YOLLARINA DİKKAT EDİN)
import GeneralSettings from './general/GeneralSettings';
import TeamSettings from './team/TeamSettings';
import IntegrationSettings from './integrations/IntegrationLayout';
import OperationSettings from './operations/OperationSettings';
import CommissionSettings from './commission/CommissionSettings'; // <-- YENİ EKLENEN (Eğer commission klasörüne koyduysanız './commission/CommissionSettings' yapın)

const SettingsLayout = () => {
  const [activeTab, setActiveTab] = useState('general');

  // MENÜ LİSTESİ (YENİ PRİM AYARLARI EKLENDİ)
  const menuItems = [
    { 
      id: 'general', 
      label: 'Genel Ayarlar', 
      icon: <Building size={20}/>, 
      desc: 'Firma kimliği, logo ve para birimi.' 
    },
    { 
      id: 'commission',  // <-- YENİ EKLENEN
      label: 'Prim Yönetimi', 
      icon: <Percent size={20}/>, 
      desc: 'Hakediş kural ve oranları.' 
    },
    { 
      id: 'team', 
      label: 'Ekip Yönetimi', 
      icon: <Users size={20}/>, 
      desc: 'Kullanıcılar, roller ve yetkiler.' 
    },
    { 
      id: 'integrations', 
      label: 'Entegrasyonlar', 
      icon: <Globe size={20}/>, 
      desc: 'Pazaryeri, kargo ve ödeme araçları.' 
    },
    { 
      id: 'operations', 
      label: 'Operasyon', 
      icon: <Briefcase size={20}/>, 
      desc: 'Mesai saatleri ve izin kuralları.' 
    },
  ];

  // İÇERİK YÖNLENDİRİCİSİ
  const renderContent = () => {
    switch(activeTab) {
      case 'general': return <GeneralSettings />;
      case 'commission': return <CommissionSettings />; // <-- YENİ EKLENEN
      case 'team': return <TeamSettings />;
      case 'integrations': return <IntegrationSettings />;
      case 'operations': return <OperationSettings />;
      default: return <div className="p-10 text-center text-slate-400">Yükleniyor...</div>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[85vh] animate-in fade-in duration-500 bg-slate-50/50 -m-8 p-8">
      
      {/* SOL: MODERN STICKY MENÜ */}
      <div className="w-full lg:w-80 flex-shrink-0">
         <div className="sticky top-8 space-y-6">
            
            {/* Menü Başlığı */}
            <div className="px-2">
               <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                  <Settings className="text-slate-400" size={24}/> Ayarlar
               </h2>
               <p className="text-sm text-slate-500 mt-1 font-medium">Sistem tercihlerinizi yönetin.</p>
            </div>

            {/* Menü Listesi */}
            <div className="space-y-2">
               {menuItems.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button 
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 group border text-left ${
                        isActive 
                        ? 'bg-white border-blue-200 shadow-lg shadow-blue-100/50 ring-1 ring-blue-100' 
                        : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'
                      }`}
                    >
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                             isActive 
                             ? 'bg-blue-600 text-white' 
                             : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                          }`}>
                             {item.icon}
                          </div>
                          <div>
                             <span className={`block font-bold text-sm ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                                {item.label}
                             </span>
                             <span className={`block text-xs mt-0.5 leading-tight ${isActive ? 'text-blue-600/80 font-medium' : 'text-slate-400'}`}>
                                {item.desc}
                             </span>
                          </div>
                       </div>
                       
                       {isActive && (
                          <ChevronRight size={18} className="text-blue-600 animate-in slide-in-from-left-2 fade-in duration-300"/>
                       )}
                    </button>
                  );
               })}
            </div>

            {/* Alt Bilgi */}
            <div className="px-4 py-4 mt-8 border-t border-slate-200/60">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sürüm</p>
               <p className="text-xs text-slate-500 font-mono mt-1">v2.4.0 (Enterprise)</p>
            </div>
         </div>
      </div>

      {/* SAĞ: İÇERİK ALANI */}
      <div className="flex-1 min-w-0">
         {/* İçerik kapsayıcısında padding'i kaldırdım çünkü CommissionSettings kendi padding'ine sahip olabilir */}
         <div className="transition-all"> 
            {renderContent()}
         </div>
      </div>

    </div>
  );
};

export default SettingsLayout;