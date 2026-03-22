import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { firebaseEnabled, firebaseEnvError } from './firebase/firebaseConfig';
import Login from './components/Login';
import { LogOut, Loader, ShieldAlert } from 'lucide-react'; 

// İkonlar
import { 
  LayoutDashboard, Calculator, BarChart3, ChevronDown, ChevronRight, 
  ClipboardList, Clock, UserCheck, Truck, Briefcase, Calendar, 
  FileText, TrendingUp, Settings as SettingsIcon,
  Percent, Instagram, Store, Package
} from 'lucide-react';

// Sayfalar
import Dashboard from './components/Dashboard';
import ScenarioPlanner from './components/ScenarioPlanner';
import OperationsManager from './components/OperationsManager';
import Settings from './components/settings/SettingsLayout';
import ReportsManager from './components/reports/ReportsManager';
import Profile from './components/Profile';

// Yeni Eklenen Bildirim Zili
import NotificationBell from './components/common/NotificationBell';

// Prim Sayfaları
import RetailCommission from './components/commission/RetailCommission';
import SocialMediaCommission from './components/commission/SocialMediaCommission';
import OperationCommission from './components/commission/OperationCommission';

// --- HATA YAKALAYICI ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Kritik Hata:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-red-50 p-10 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Beklenmeyen Bir Hata Oluştu</h2>
            <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition">Sayfayı Yenile</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- ANA UYGULAMA ---
const MainApp = () => {
  const { logout, currentUser, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Menü Durumları
  const [isPlanningOpen, setIsPlanningOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-31');
  const [compareMode, setCompareMode] = useState(false);

  // --- YETKİ KONTROLÜ ---
  const hasPerm = (permId) => {
    if (!userData) return false;
    if (['Admin', 'Manager', 'CEO', 'Director'].includes(userData.role)) return true; 
    
    const userPermissions = Array.isArray(userData.permissions) ? userData.permissions : [];
    return userPermissions.includes(permId);
  };

  const setPreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  const getTitle = () => {
    if (activeTab === 'commission-social') return 'Sosyal Medya Primleri';
    if (activeTab === 'commission-retail') return 'Mağaza Satış Primleri';
    if (activeTab === 'commission-operation') return 'Operasyon Primleri';
    if (activeTab.startsWith('reports-')) return 'Raporlar ve Analizler';
    if (activeTab === 'settings') return 'Sistem Ayarları';
    if (activeTab === 'profile') return 'Profilim';
    
    switch(activeTab) {
      case 'dashboard': return 'Yönetici Paneli';
      case 'planner': return 'Bütçe Simülasyonu';
      case 'tasks': return 'İş Emirleri Yönetimi';
      case 'orders': return 'Manuel Sipariş Yönetimi';
      case 'shifts': return 'Personel Giriş/Çıkış';
      case 'leaves': return 'İzin Yönetim Sistemi';
      case 'daily-reports': return 'Personel Günlük Raporları';
      default: return 'Panel';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-all flex-shrink-0 z-20">
        <div className="p-6 text-2xl font-bold tracking-tighter text-blue-400 flex items-center gap-2">
          E-ComPilot
        </div>
        
        {/* Kullanıcı Kartı */}
        <div 
          onClick={() => setActiveTab('profile')}
          className="px-6 pb-6 border-b border-slate-800 mb-2 cursor-pointer group"
        >
           <div className="flex items-center gap-3 p-2 -ml-2 rounded-lg transition-colors group-hover:bg-slate-800/50">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${userData?.avatarColor || 'bg-blue-600'}`}>
                 {userData?.name?.charAt(0) || '?'}
              </div>
              <div className="overflow-hidden">
                 <p className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">{userData?.name || currentUser?.email}</p>
                 <p className="text-[10px] text-slate-400 uppercase">{userData?.role || 'Kullanıcı'}</p>
              </div>
           </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
          
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Genel Bakış" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}/>
          
          <SidebarItem icon={<Calculator size={20}/>} label="Senaryo Planlayıcı" active={activeTab === 'planner'} onClick={() => setActiveTab('planner')}/>
          
          {/* PLANLAMA & YÖNETİM */}
          <div className="pt-2 pb-1">
            <button onClick={() => setIsPlanningOpen(!isPlanningOpen)} className="flex items-center justify-between w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
              <div className="flex items-center gap-3"><Briefcase size={20}/><span className="font-medium">Planlama & Yönetim</span></div>
              {isPlanningOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
            </button>
            {isPlanningOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-2">
                 <SidebarSubItem icon={<ClipboardList size={18}/>} label="İş Emirleri" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')}/>
                 <SidebarSubItem icon={<Truck size={18}/>} label="Manuel Siparişler" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')}/>
                 <SidebarSubItem icon={<FileText size={18}/>} label="Günlük Raporlar" active={activeTab === 'daily-reports'} onClick={() => setActiveTab('daily-reports')}/>
                 <SidebarSubItem icon={<Clock size={18}/>} label="Giriş/Çıkış" active={activeTab === 'shifts'} onClick={() => setActiveTab('shifts')}/>
                 <SidebarSubItem icon={<UserCheck size={18}/>} label="İzin Sistemi" active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')}/>
              </div>
            )}
          </div>

          {/* PRIM SISTEMI */}
          <div className="pt-1">
            <button onClick={() => setIsCommissionOpen(!isCommissionOpen)} className="flex items-center justify-between w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
              <div className="flex items-center gap-3"><Percent size={20}/><span className="font-medium">Prim Sistemi</span></div>
              {isCommissionOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
            </button>
            {isCommissionOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-2">
                 <SidebarSubItem icon={<Instagram size={18}/>} label="Sosyal Medya" active={activeTab === 'commission-social'} onClick={() => setActiveTab('commission-social')}/>
                 <SidebarSubItem icon={<Store size={18}/>} label="Mağaza Satış" active={activeTab === 'commission-retail'} onClick={() => setActiveTab('commission-retail')}/>
                 <SidebarSubItem icon={<Package size={18}/>} label="Operasyon (Paket)" active={activeTab === 'commission-operation'} onClick={() => setActiveTab('commission-operation')}/>
              </div>
            )}
          </div>

          {/* RAPORLAR */}
          <div className="pt-1">
            <button onClick={() => setIsReportsOpen(!isReportsOpen)} className="flex items-center justify-between w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
              <div className="flex items-center gap-3"><BarChart3 size={20}/><span className="font-medium">Raporlar</span></div>
              {isReportsOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
            </button>
            {isReportsOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-2">
                 <SidebarSubItem icon={<TrendingUp size={18}/>} label="Satış Raporları" active={activeTab === 'reports-sales'} onClick={() => setActiveTab('reports-sales')}/>
                 <SidebarSubItem icon={<UserCheck size={18}/>} label="Personel Performans" active={activeTab === 'reports-staff'} onClick={() => setActiveTab('reports-staff')}/>
                 <SidebarSubItem icon={<Truck size={18}/>} label="Operasyon & Lojistik" active={activeTab === 'reports-operations'} onClick={() => setActiveTab('reports-operations')}/>
                 <SidebarSubItem icon={<Calculator size={18}/>} label="Finansal Raporlar" active={activeTab === 'reports-finance'} onClick={() => setActiveTab('reports-finance')}/>
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
          <SidebarItem icon={<SettingsIcon size={20}/>} label="Ayarlar" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 text-red-400 hover:bg-slate-800 hover:text-red-300">
            <LogOut size={20}/> <span className="font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
        
        {/* HEADER: Başlık + Sağ Taraf */}
        <header className="mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{getTitle()}</h1>
            <p className="text-slate-500 mt-1">
              {activeTab === 'dashboard' ? 'Operasyonel süreçlerinizi buradan yönetin.' : 
               activeTab === 'profile' ? 'Hesap bilgilerinizi güncelleyin.' : 'Detaylı yönetim paneli.'}
            </p>
          </div>
          
          {/* SAĞ TARAF: AKSİYONLAR */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* 1. TARİH SEÇİCİ (SOLDA) */}
            {['dashboard', 'reports-sales', 'reports-finance'].includes(activeTab) && (
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
                <div className="flex gap-1 border-r border-slate-200 pr-3">
                  <button onClick={() => setPreset(0)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded">Bugün</button>
                  <button onClick={() => setPreset(1)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded">Dün</button>
                  <button onClick={() => setPreset(7)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded">Son 7 Gün</button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Calendar size={14} className="absolute left-2 top-2.5 text-slate-400 pointer-events-none"/>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-8 pr-2 py-1.5 border border-slate-200 rounded text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"/>
                  </div>
                  <span className="text-slate-400">-</span>
                  <div className="relative">
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"/>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pl-3 border-l border-slate-200 select-none">
                  <div className="relative">
                    <input type="checkbox" checked={compareMode} onChange={() => setCompareMode(!compareMode)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                  <span className="text-xs font-bold text-slate-500">Kıyasla</span>
                </label>
              </div>
            )}

            {/* 2. BİLDİRİM ZİLİ (SAĞDA) */}
            <NotificationBell />

          </div>
        </header>

        {/* --- SAYFA RENDER MANTIĞI --- */}
        
        {/* PROFİL */}
        {activeTab === 'profile' && <Profile />}

        {/* 1. DASHBOARD */}
        {activeTab === 'dashboard' && (
            hasPerm('dashboard') 
            ? <Dashboard startDate={startDate} endDate={endDate} compareMode={compareMode}/>
            : <AccessDeniedMessage title="Genel Bakış" message="Dashboard verilerini görüntüleme yetkiniz bulunmamaktadır."/>
        )}

        {/* 2. PLANLAYICI */}
        {activeTab === 'planner' && (
            hasPerm('planner') 
            ? <ScenarioPlanner />
            : <AccessDeniedMessage title="Senaryo Planlayıcı" message="Bütçe planlama modülüne erişim yetkiniz yok."/>
        )}
        
        {/* 3. OPERASYON YÖNETİMİ */}
        {['tasks', 'orders', 'shifts', 'leaves', 'daily-reports'].includes(activeTab) && (
            hasPerm(activeTab.replace('daily-reports', 'daily_reports')) 
            ? <OperationsManager view={activeTab === 'daily-reports' ? 'reports' : activeTab} />
            : <AccessDeniedMessage title="Operasyon Yönetimi" message="Bu operasyon modülüne erişim yetkiniz bulunmamaktadır."/>
        )}

        {/* 4. PRİM SİSTEMİ */}
        {activeTab === 'commission-retail' && (
            hasPerm('retail') 
            ? <RetailCommission />
            : <AccessDeniedMessage title="Mağaza Primleri" message="Mağaza satış primlerini görüntüleme yetkiniz yok."/>
        )}
        {activeTab === 'commission-social' && (
            hasPerm('social') 
            ? <SocialMediaCommission />
            : <AccessDeniedMessage title="Sosyal Medya Primleri" message="Sosyal medya primlerine erişiminiz yok."/>
        )}
        {activeTab === 'commission-operation' && (
            hasPerm('operation') 
            ? <OperationCommission />
            : <AccessDeniedMessage title="Operasyon Primleri" message="Operasyon primlerine erişiminiz yok."/>
        )}

        {/* 5. RAPORLAR */}
        {activeTab.startsWith('reports-') && (
            hasPerm('reports') 
            ? <ReportsManager view={activeTab} />
            : <AccessDeniedMessage title="Raporlar" message="Raporlama modülüne erişim yetkiniz bulunmamaktadır."/>
        )}
        
        {/* 6. AYARLAR */}
        {activeTab === 'settings' && (
            hasPerm('settings') 
            ? <Settings />
            : <AccessDeniedMessage title="Ayarlar" message="Sistem ayarlarına sadece yöneticiler erişebilir."/>
        )}

      </main>
    </div>
  );
};

// --- YARDIMCI BİLEŞENLER ---
const AccessDeniedMessage = ({ title, message }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-300">
    <div className="bg-red-50 p-6 rounded-full mb-6">
        <ShieldAlert size={64} className="text-red-500" />
    </div>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
    <p className="text-slate-500 max-w-md mb-6">{message}</p>
    <div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
        Erişim izni için yöneticinizle görüşün.
    </div>
  </div>
);

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    {icon} <span className="font-medium">{label}</span>
  </button>
);

const SidebarSubItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm transition-all duration-200 ${active ? 'bg-slate-800 text-blue-400 font-bold border-r-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
    {icon} <span>{label}</span>
  </button>
);

const FIREBASE_SETUP_STEPS = [
  '1. Firebase Console / Project settings / Your apps / Web app config alanını açın.',
  '2. Lokalinizde çalışan .env.local dosyası varsa aynı değerleri kopyalayın.',
  '3. Vercel / Project Settings / Environment Variables bölümünde tüm VITE_FIREBASE_* değişkenlerini en az Production ortamına ekleyin.',
  '4. Değişkenleri ekledikten sonra Redeploy çalıştırın; eski deployment bu değerleri sonradan otomatik almaz.',
];

const FirebaseConfigNotice = () => (
  <div className="min-h-screen bg-slate-50 px-6 py-10 flex items-center justify-center">
    <div className="w-full max-w-2xl rounded-3xl border border-amber-200 bg-white p-8 shadow-xl">
      <div className="mb-6 inline-flex rounded-2xl bg-amber-100 p-4 text-amber-600">
        <ShieldAlert size={32} />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-3">Firebase ayarları eksik</h1>
      <p className="text-slate-600 mb-6 leading-7">
        Uygulama derlenmiş olsa da Firebase environment değişkenleri Vercel projesine eklenmediği için giriş ekranı başlatılamıyor.
        Bu yüzden artık boş ekran yerine açıklayıcı bir kurulum ekranı gösteriyoruz.
      </p>
      <div className="rounded-2xl bg-slate-900 p-5 text-left text-sm text-slate-100 overflow-x-auto">
        <pre className="whitespace-pre-wrap font-mono">{firebaseEnvError}</pre>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
        <p className="mb-3 font-semibold">Vercel'de yapmanız gerekenler</p>
        <div className="space-y-2">
          {FIREBASE_SETUP_STEPS.map((step) => (
            <p key={step}>{step}</p>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// --- ANA COMPONENT ---
const App = () => {
  if (!firebaseEnabled) {
    return <FirebaseConfigNotice />;
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <AuthGuard />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

const AuthGuard = () => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Loader size={48} className="animate-spin mb-4 text-blue-600"/>
        <span className="font-medium">Sistem Yükleniyor...</span>
      </div>
    );
  }
  
  return currentUser ? <MainApp /> : <Login />;
};

export default App;
