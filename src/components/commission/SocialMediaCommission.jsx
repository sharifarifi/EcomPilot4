import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Target, DollarSign, Users, Calculator, AlertCircle, 
  BarChart3, Save, CheckCircle2, Zap, Crown, Trophy,
  Calendar, Download, Printer, Share2, ChevronDown, MoreHorizontal,
  X, History, Star, ArrowRight, PieChart, Sparkles, Award, Loader2, EyeOff
} from 'lucide-react';

// FIREBASE SERVİSLERİ
import { subscribeToCommissionSettings } from '../../firebase/commissionSettingsService';
import { getStaffMonthlyData, saveStaffMonthlyData, getAllStaffMonthlyData } from '../../firebase/commissionDataService';
import { getAllTeamMembers } from '../../firebase/teamService'; // TÜM PERSONEL İÇİN EKLENDİ
import { useAuth } from '../../context/AuthContext'; 

// --- YARDIMCI: PARA FORMATI ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
};


const getTierRate = (tiers = [], rate) => {
  if (!tiers.length) return 0;

  const matchedTier = tiers.find(tier => rate >= tier.min && rate <= tier.max);
  if (matchedTier) return matchedTier.rate;

  if (rate > 0) {
    const maxTier = tiers[tiers.length - 1];
    if (maxTier && rate > maxTier.max) return maxTier.rate;
  }

  return 0;
};

const getManualBonusRate = (manualBonuses = [], manualRatio) => {
  if (!manualBonuses.length) return 0;

  const matchedBonus = manualBonuses.find(bonus => manualRatio >= bonus.minRatio && manualRatio <= bonus.maxRatio);
  if (matchedBonus) return matchedBonus.extraRate;

  const maxBonus = manualBonuses[manualBonuses.length - 1];
  if (maxBonus && manualRatio > maxBonus.maxRatio) return maxBonus.extraRate;

  return 0;
};

const calculateSocialCommission = ({ webSales = 0, manualSales = 0, targetRevenue = 0, rules = null }) => {
  const totalRevenue = Number(webSales) + Number(manualSales);
  const achievementRate = targetRevenue > 0 ? (totalRevenue / targetRevenue) * 100 : 0;
  const baseRate = getTierRate(rules?.tiers || [], achievementRate);
  const manualRatio = totalRevenue > 0 ? (Number(manualSales) / totalRevenue) * 100 : 0;
  const bonusRate = getManualBonusRate(rules?.manualBonuses || [], manualRatio);
  const baseCommissionAmount = totalRevenue * (baseRate / 100);
  const bonusCommissionAmount = Number(manualSales) * (bonusRate / 100);
  const leaderBonusAmount = rules?.isLeaderBonusActive ? Number(manualSales) * ((rules.leaderBonus || 0) / 100) : 0;

  return {
    totalRevenue,
    achievementRate,
    baseRate,
    bonusRate,
    baseCommissionAmount,
    bonusCommissionAmount,
    leaderBonusAmount
  };
};

// --- YARDIMCI: PERSONEL DETAY MODALI ---
const StaffDetailModal = ({ person, onClose, canSeeDetails }) => {
  if (!person) return null;

  // Gizlilik kontrolü
  const displayValue = (val, isCurrency = true) => {
    if (canSeeDetails) return isCurrency ? formatCurrency(val) : val;
    return '******';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-start">
           <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-inner ${person.avatar || 'bg-slate-200 text-slate-600'}`}>
                 {person.name?.charAt(0)}
              </div>
              <div>
                 <h3 className="text-2xl font-black text-slate-800">{person.name}</h3>
                 <p className="text-slate-500 font-medium">{person.userEmail || 'Personel'}</p>
                 <div className="flex gap-2 mt-2">
                    {person.isLeader && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Crown size={12}/> Satış Lideri</span>}
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Aktif</span>
                 </div>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition"><X size={20} className="text-slate-500"/></button>
        </div>

        {/* Modal Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
           {!canSeeDetails && (
             <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm font-bold flex items-center gap-2">
               <EyeOff size={16}/> Gizlilik Modu: Finansal veriler gizlenmiştir.
             </div>
           )}

           {/* İstatistikler */}
           <div className="grid grid-cols-2 gap-4"> 
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                 <p className="text-xs text-slate-400 font-bold uppercase mb-1">Manuel Ciro</p>
                 <p className="text-xl font-black text-slate-800">{displayValue(person.manualSales || 0)}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                 <p className="text-xs text-slate-400 font-bold uppercase mb-1">Toplam Prim</p>
                 <p className="text-xl font-black text-green-600">{displayValue(person.totalPayout || 0)}</p>
              </div>
           </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
           <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-white hover:shadow-sm rounded-xl transition">Kapat</button>
        </div>
      </div>
    </div>
  );
};


const getTierRate = (tiers = [], achievementRate = 0) => {
  const matchedTier = tiers.find(t => achievementRate >= t.min && achievementRate <= t.max);
  if (matchedTier) return matchedTier.rate;

  if (achievementRate > 0) {
    const maxTier = tiers[tiers.length - 1];
    if (maxTier && achievementRate > maxTier.max) return maxTier.rate;
  }

  return 0;
};

const getManualBonusRate = (manualBonuses = [], manualRatio = 0) => {
  const matchedBonus = manualBonuses.find(b => manualRatio >= b.minRatio && manualRatio <= b.maxRatio);
  if (matchedBonus) return matchedBonus.extraRate;

  const maxBonus = manualBonuses[manualBonuses.length - 1];
  if (maxBonus && manualRatio > maxBonus.maxRatio) return maxBonus.extraRate;

  return 0;
};

const calculateCommissionMetrics = ({ webSales = 0, manualSales = 0, targetRevenue = 0, rules = null, includeLeaderBonus = false }) => {
  const totalRevenue = Number(webSales) + Number(manualSales);
  const achievementRate = targetRevenue > 0 ? (totalRevenue / targetRevenue) * 100 : 0;
  const baseRate = getTierRate(rules?.tiers, achievementRate);
  const manualRatio = totalRevenue > 0 ? (Number(manualSales) / totalRevenue) * 100 : 0;
  const bonusRate = getManualBonusRate(rules?.manualBonuses, manualRatio);
  const baseCommissionAmount = totalRevenue * (baseRate / 100);
  const bonusCommissionAmount = Number(manualSales) * (bonusRate / 100);
  const leaderBonusAmount = includeLeaderBonus && rules?.isLeaderBonusActive
    ? Number(manualSales) * ((Number(rules.leaderBonus) || 0) / 100)
    : 0;

  return {
    totalRevenue,
    achievementRate,
    baseRate,
    bonusRate,
    baseCommissionAmount,
    bonusCommissionAmount,
    leaderBonusAmount,
    totalPayout: baseCommissionAmount + bonusCommissionAmount + leaderBonusAmount,
  };
};

const SocialMediaCommission = () => {
  const { currentUser, userData } = useAuth();
  
  // --- STATE ---
  const [isSimulationMode, setIsSimulationMode] = useState(false); 
  const [selectedPerson, setSelectedPerson] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Veriler (Kişisel)
  const [webSales, setWebSales] = useState(0);
  const [manualSales, setManualSales] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Veriler (Tüm Ekip - Birleştirilmiş)
  const [mergedStaffData, setMergedStaffData] = useState([]);

  // Kurallar
  const [rules, setRules] = useState(null);
  

  // YETKİ KONTROLÜ
  const isAuthorized = ['Admin', 'Manager', 'Director', 'CEO'].includes(userData?.role);

  // 1. VERİLERİ VE KURALLARI ÇEK
  useEffect(() => {
    const unsubRules = subscribeToCommissionSettings((data) => {
      if (data && data.social) {
        setRules(data.social);
      }
    });
    return () => unsubRules();
  }, []);

  // 2. VERİLERİ ÇEK VE BİRLEŞTİR
  useEffect(() => {
    if(!rules) return; 

    const fetchData = async () => {
      setLoading(true);
      
      try {
        // A. Kendi verimi çek (Inputları doldurmak için)
        if (currentUser) {
          const myData = await getStaffMonthlyData(currentUser.uid, currentDate);
          if (myData && !isSimulationMode) {
            setWebSales(Number(myData.webSales) || 0);
            setManualSales(Number(myData.manualSales) || 0);
          } else if (!isSimulationMode) {
            setWebSales(0);
            setManualSales(0);
          }
        }

        // B. TÜM EKİBİ VE KAYDEDİLMİŞ VERİLERİ ÇEK
        const [allUsers, monthlyData] = await Promise.all([
            getAllTeamMembers(),
            getAllStaffMonthlyData(currentDate)
        ]);

        // C. Filtrele: Sosyal Medya Departmanı
        const socialStaff = allUsers.filter(u => {
            const dept = u.department ? u.department.toLowerCase() : '';
            const role = u.role ? u.role.toLowerCase() : '';
            return (
                dept.includes('sosyal') || 
                dept.includes('social') || 
                dept.includes('medya') ||
                dept.includes('media') ||
                role === 'social media'
            );
        });

        // D. Birleştir
        const mergedList = socialStaff.map(user => {
            const savedData = monthlyData.find(d => d.userEmail === user.email || d.id === user.uid);
            
            // Eğer kaydedilmiş veri varsa onu kullan, yoksa kullanıcıyı sıfır değerlerle başlat
            return {
                id: user.uid || user.id,
                name: user.name || user.displayName || (savedData ? savedData.userName : 'İsimsiz'),
                userEmail: user.email,
                avatar: user.avatarColor,
                // Veriler
                webSales: savedData ? Number(savedData.webSales) : 0,
                manualSales: savedData ? Number(savedData.manualSales) : 0,
                // Diğer alanlar hesaplamada doldurulacak
            };
        });

        setMergedStaffData(mergedList);

      } catch (error) {
          console.error("Veri hatası:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [currentDate, currentUser, isSimulationMode, rules]);

  const targetRevenue = rules?.monthlyTarget || 1000000;

  const personalCommission = useMemo(() => (
    calculateSocialCommission({ webSales, manualSales, targetRevenue, rules })
  ), [webSales, manualSales, targetRevenue, rules]);
  const personalMetrics = useMemo(() => calculateCommissionMetrics({
    webSales,
    manualSales,
    targetRevenue,
    rules,
    includeLeaderBonus: true
  }), [webSales, manualSales, targetRevenue, rules]);

  const {
    totalRevenue,
    achievementRate,
    baseRate,
    bonusRate,
    baseCommissionAmount,
    bonusCommissionAmount,
    leaderBonusAmount
  } = personalCommission;
  } = personalMetrics;

  // 4. LİSTE HESAPLAMASI (Tüm personel için kuralları uygula)
  const teamList = useMemo(() => {
    if (!mergedStaffData || mergedStaffData.length === 0 || !rules) return [];

    // A. Her personel için primleri tekrar hesapla
    const calculatedList = mergedStaffData.map(person => {
        const metrics = calculateSocialCommission({
          webSales: person.webSales || 0,
          manualSales: person.manualSales || 0,
          targetRevenue,
          rules
        });

        return {
            ...person,
            ...metrics,
            rawTotal: metrics.baseCommissionAmount + metrics.bonusCommissionAmount // Lider bonusu hariç

        return {
            ...person,
            ...metrics,
            rawTotal: metrics.baseCommissionAmount + metrics.bonusCommissionAmount // Lider bonusu hariç
    const calculatedList = mergedStaffData.map(p => {
        const metrics = calculateCommissionMetrics({
            webSales: p.webSales || 0,
            manualSales: p.manualSales || 0,
            targetRevenue,
            rules
        });

        return {
            ...p,
            ...metrics,
            rawTotal: metrics.totalPayout
        };
    });

    // B. Lideri Bul (En yüksek Manuel Ciro)
    let maxManualSales = 0;
    calculatedList.forEach(p => {
        if (p.manualSales > maxManualSales) maxManualSales = p.manualSales;
    });

    // C. Lider Bonusunu Ekle ve Sırala
    return calculatedList.map(p => {
        const isLeader = p.manualSales === maxManualSales && maxManualSales > 0;
        const actualLeaderBonus = isLeader && rules.isLeaderBonusActive ? (p.manualSales * (rules.leaderBonus / 100)) : 0;
        
        return {
            ...p,
            isLeader,
            leaderBonusAmount: actualLeaderBonus,
            totalPayout: p.rawTotal + actualLeaderBonus
        };
    }).sort((a, b) => b.totalPayout - a.totalPayout); // Çok kazanandan aza sırala

  }, [mergedStaffData, rules, targetRevenue]);

  const totalPayoutBudget = teamList.reduce((acc, curr) => acc + curr.totalPayout, 0);

  // 5. KAYDETME
  const handleSave = async () => {
    if (isSimulationMode) return alert("Simülasyon modunda kayıt yapılamaz.");
    
    setSaving(true);
    try {
      const dataToSave = {
        webSales: Number(webSales),
        manualSales: Number(manualSales),
        totalRevenue,
        achievementRate,
        baseCommissionAmount,
        bonusCommissionAmount,
        leaderBonusAmount, // Tahmini
        userName: userData?.name || 'Personel',
        userEmail: userData?.email,
        avatarColor: userData?.avatarColor,
        department: userData?.department || 'Sosyal Medya'
      };
      
      await saveStaffMonthlyData(currentUser.uid, currentDate, dataToSave);
      
      // Sayfayı yenilemeye gerek yok, state güncellenince liste de güncellenir
      // Ama verileri tekrar çekmek daha garanti
      window.location.reload();

    } catch (error) {
      alert("Hata: " + error.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center items-center h-96 text-slate-400"><Loader2 className="animate-spin mr-2"/> Veriler yükleniyor...</div>;

  return (
    <div className={`space-y-8 animate-in fade-in duration-500 pb-12 font-sans relative ${isSimulationMode ? 'bg-amber-50/30 -m-8 p-8 rounded-3xl' : ''}`}>
      
      {/* SİMÜLASYON MODU UYARISI */}
      {isSimulationMode && (
         <div className="bg-amber-100 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center justify-between mb-4 shadow-sm animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
               <Sparkles size={18} className="animate-pulse"/>
               <span className="font-bold text-sm">Simülasyon Modu Aktif:</span>
               <span className="text-sm">Değişiklikler kaydedilmez, sadece tahminleme içindir.</span>
            </div>
            <button onClick={() => setIsSimulationMode(false)} className="text-xs font-bold bg-white/50 hover:bg-white px-3 py-1.5 rounded-lg transition">Moddan Çık</button>
         </div>
      )}

      {/* 1. BAŞLIK */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Sosyal Medya Primleri</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Satış hedefleri ve manuel sipariş performansına dayalı hakediş yönetimi.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-500">Dönem:</span>
              <input 
                type="month" 
                value={currentDate} 
                onChange={(e) => setCurrentDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer"
              />
           </div>
           <button 
             onClick={() => setIsSimulationMode(!isSimulationMode)} 
             className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition ${isSimulationMode ? 'bg-amber-500 text-white border-amber-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
           >
              <Calculator size={16}/> {isSimulationMode ? 'Simülasyonu Bitir' : 'Senaryo Dene'}
           </button>
        </div>
      </div>

      {/* 2. ANA KONTROL PANELİ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         
         {/* SOL: VERİ GİRİŞİ (4/12) */}
         <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
            <div>
               <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><Target size={20} className="text-indigo-500"/> Hedef Ayarları</h3>
               
               <div className="space-y-6">
                  <div className="relative group">
                     <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">Aylık Ciro Hedefi</label>
                     <div className="relative">
                        <div className="absolute left-4 top-3.5 text-slate-400 font-bold">₺</div>
                        <input 
                          type="number" 
                          disabled 
                          className="w-full pl-9 pr-4 py-3 border border-slate-200 bg-slate-100 rounded-2xl font-bold text-slate-500 cursor-not-allowed"
                          value={targetRevenue}
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">Web Satışı</label>
                        <input 
                          type="number" 
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition"
                          value={webSales}
                          onChange={(e) => setWebSales(Number(e.target.value))}
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">Manuel Sipariş</label>
                        <input 
                          type="number" 
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-orange-500 outline-none transition"
                          value={manualSales}
                          onChange={(e) => setManualSales(Number(e.target.value))}
                        />
                     </div>
                  </div>
               </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
               <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-slate-600">Hedef İlerleme</span>
                  <span className={`text-xl font-black ${achievementRate >= 100 ? 'text-green-500' : 'text-slate-800'}`}>%{achievementRate.toFixed(1)}</span>
               </div>
               <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner relative">
                  <div className={`h-full rounded-full transition-all duration-1000 ${achievementRate >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-blue-500 to-indigo-400'}`} style={{width: `${Math.min(achievementRate, 100)}%`}}></div>
               </div>
               <p className="text-xs text-slate-400 mt-2 text-center">Hedefin {achievementRate >= 100 ? 'üzerindesiniz, tebrikler!' : 'altındasınız.'}</p>
               
               {!isSimulationMode && (
                 <button 
                   onClick={handleSave} 
                   disabled={saving}
                   className="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                 >
                    {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                    {saving ? 'Kaydediliyor...' : 'Verileri Kaydet'}
                 </button>
               )}
            </div>
         </div>

         {/* SAĞ: DETAYLI KARTLAR (8/12) */}
         <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KARTLAR AYNI ŞEKİLDE KORUNDU */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between relative overflow-hidden transition-all duration-500 group ${baseRate > 0 ? 'bg-blue-50/50 border-blue-100 hover:border-blue-300' : 'bg-white border-slate-200'}`}>
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600"><TrendingUp size={16}/></span>
                     <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ana Prim</span>
                  </div>
                  <h3 className="text-4xl font-black text-slate-800 mb-1">%{baseRate.toFixed(2)}</h3>
                  <div className="mt-6 pt-4 border-t border-blue-100/50 flex justify-between items-end">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">HAKEDİŞ</span>
                     <span className="text-xl font-black text-blue-600">{formatCurrency(baseCommissionAmount)}</span>
                  </div>
               </div>
            </div>

            <div className={`p-6 rounded-3xl border flex flex-col justify-between relative overflow-hidden transition-all duration-500 group ${bonusRate > 0 ? 'bg-orange-50/50 border-orange-100 hover:border-orange-300' : 'bg-white border-slate-200'}`}>
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-orange-600"><Zap size={16} fill="currentColor"/></span>
                     <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Manuel Bonus</span>
                  </div>
                  <h3 className="text-4xl font-black text-slate-800 mb-1">+{bonusRate.toFixed(2)}%</h3>
                  <div className="mt-6 pt-4 border-t border-orange-100/50 flex justify-between items-end">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">EKSTRA</span>
                     <span className="text-xl font-black text-orange-600">+{formatCurrency(bonusCommissionAmount)}</span>
                  </div>
               </div>
            </div>

            <div className={`p-6 rounded-3xl border flex flex-col justify-between relative overflow-hidden transition-all duration-500 group ${leaderBonusAmount > 0 ? 'bg-purple-50/50 border-purple-100 hover:border-purple-300' : 'bg-white border-slate-200'}`}>
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-purple-600"><Crown size={16} fill="currentColor"/></span>
                     <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lider Ödülü</span>
                  </div>
                  <h3 className="text-4xl font-black text-slate-800 mb-1">
                     +%{(rules?.leaderBonus || 0.25).toFixed(2)}
                  </h3>
                  <div className="mt-6 pt-4 border-t border-purple-100/50 flex justify-between items-end">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">LİDER TUTARI</span>
                     <span className="text-xl font-black text-purple-600">+{formatCurrency(leaderBonusAmount)}</span>
                  </div>
               </div>
            </div>

            {/* DAĞILIM CHART */}
            <div className="col-span-1 md:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-xl text-slate-600"><PieChart size={20}/></div>
                  <div>
                     <p className="text-xs font-bold text-slate-400 uppercase">Tahmini Toplam Prim</p>
                     <p className="text-2xl font-black text-slate-800">{formatCurrency(totalPayoutBudget)}</p>
                  </div>
               </div>
               {/* ... Diğer göstergeler ... */}
            </div>
         </div>
      </div>

      {/* 3. PERSONEL TABLOSU */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
               <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Users size={20} className="text-slate-500"/> Sosyal Medya Ekibi</h3>
               <p className="text-xs text-slate-500">Liste manuel ciro performansına göre sıralanmıştır.</p>
            </div>
            <div className="flex items-center gap-2">
               {!isAuthorized && <span className="text-[10px] flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-1 rounded"><EyeOff size={10}/> Gizlilik Modu</span>}
               <div className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-500">{teamList.length} Personel</div>
            </div>
         </div>
         <div className="overflow-x-auto">
         <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
               <tr>
                  <th className="px-6 py-4 w-12 text-center">#</th>
                  <th className="px-6 py-4">Personel</th>
                  <th className="px-6 py-4 text-center">Manuel Ciro</th>
                  <th className="px-6 py-4 text-center">Baz Prim</th>
                  <th className="px-6 py-4 text-center">Manuel Bonus</th>
                  <th className="px-6 py-4 text-center">Lider Bonusu</th>
                  <th className="px-6 py-4 text-right">Net Ödeme</th>
                  <th className="px-6 py-4 text-center">Detay</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {teamList.map((person, i) => {
                  const isMe = person.id === currentUser?.uid;
                  const canSeeDetails = isAuthorized || isMe;
                  const hiddenContent = <span className="text-slate-300 font-mono tracking-widest text-xs select-none">••••••</span>;

                  return (
                     <tr 
                        key={i} 
                        onClick={() => setSelectedPerson(person)}
                        className={`cursor-pointer transition-all duration-200 ${person.isLeader ? 'bg-purple-50/30 hover:bg-purple-50/60' : (isMe ? 'bg-blue-50/30' : 'hover:bg-slate-50')}`}
                     >
                        <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">
                           {i === 0 && person.isLeader ? <Trophy size={16} className="text-yellow-500 mx-auto"/> : i + 1}
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${person.avatar || 'bg-slate-100 text-slate-500'}`}>
                                 {person.name?.charAt(0)}
                              </div>
                              <div>
                                 <div className="font-bold text-slate-700 flex items-center gap-2">
                                    {person.name}
                                    {person.isLeader && <span className="bg-purple-100 text-purple-700 text-[9px] px-1.5 py-0.5 rounded font-black flex items-center gap-1 border border-purple-200 shadow-sm"><Crown size={10} fill="currentColor"/> LİDER</span>}
                                    {isMe && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">SİZ</span>}
                                 </div>
                                 <div className="text-[10px] text-slate-400">Sosyal Medya</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-slate-600 text-xs font-bold bg-slate-50/50 rounded-lg mx-2">
                           {canSeeDetails ? formatCurrency(person.manualSales || 0) : hiddenContent}
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-slate-500">
                           {canSeeDetails ? formatCurrency(person.baseCommissionAmount || 0) : hiddenContent}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-orange-600">
                           {canSeeDetails ? `+${formatCurrency(person.bonusCommissionAmount || 0)}` : hiddenContent}
                        </td>
                        <td className="px-6 py-4 text-center">
                           {person.isLeader && rules?.isLeaderBonusActive 
                              ? (canSeeDetails ? <span className="font-black text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100">+{formatCurrency(person.leaderBonusAmount)}</span> : hiddenContent)
                              : <span className="text-slate-300">-</span>
                           }
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className={`font-black text-lg ${person.totalPayout > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                              {canSeeDetails ? formatCurrency(person.totalPayout || 0) : hiddenContent}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition">
                              <ArrowRight size={16}/>
                           </button>
                        </td>
                     </tr>
                  );
               })}
               {teamList.length === 0 && (
                  <tr><td colSpan="8" className="p-8 text-center text-slate-400">Bu departmanda personel bulunamadı.</td></tr>
               )}
            </tbody>
         </table>
         </div>
      </div>

      {/* PERSONEL DETAY MODALI */}
      {selectedPerson && (
        <StaffDetailModal 
          person={selectedPerson} 
          onClose={() => setSelectedPerson(null)} 
          canSeeDetails={isAuthorized || selectedPerson.id === currentUser?.uid}
        />
      )}

    </div>
  );
};

export default SocialMediaCommission;
