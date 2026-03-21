import React, { useState, useEffect } from 'react';
import { 
  Store, Users, Lock, Unlock, 
  UserCheck, Save, Loader2, 
  Calendar, EyeOff
} from 'lucide-react';

// FIREBASE SERVİSLERİ
import { subscribeToCommissionSettings } from '../../firebase/commissionSettingsService';
import { getStaffMonthlyData, saveStaffMonthlyData, getAllStaffMonthlyData } from '../../firebase/commissionDataService';
// DİKKAT: Verileri TeamSettings.jsx ile aynı yerden çekiyoruz:
import { getAllTeamMembers } from '../../firebase/teamService'; 
import { useAuth } from '../../context/AuthContext'; 

// --- YARDIMCI FONKSİYONLAR ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
};

const getRankBadge = (index) => {
  if (index === 0) return '🥇'; 
  if (index === 1) return '🥈'; 
  if (index === 2) return '🥉'; 
  return `#${index + 1}`;
};

const CommissionRetail = () => {
  const { currentUser, userData } = useAuth();
  
  // --- STATE ---
  const [rulesLoading, setRulesLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // AYARLAR
  const [rules, setRules] = useState(null);

  // GİRDİLER (Kişisel)
  const [personalSales, setPersonalSales] = useState(0); 
  const [personalTarget, setPersonalTarget] = useState(0); 

  // VERİLER (Tüm Ekip)
  const [allStaffData, setAllStaffData] = useState([]);

  // HESAPLANANLAR
  const [storeTotalSales, setStoreTotalSales] = useState(0); 
  const [storeTargetProgress, setStoreTargetProgress] = useState(0); 
  const [isStoreTargetMet, setIsStoreTargetMet] = useState(false); 
  
  const [personalSuccessRate, setPersonalSuccessRate] = useState(0); 
  const [personalCommissionRate, setPersonalCommissionRate] = useState(0); 
  
  // TUTARLAR
  const [teamBonusAmount, setTeamBonusAmount] = useState(0); 
  const [personalCommissionAmount, setPersonalCommissionAmount] = useState(0); 
  const [totalEarnings, setTotalEarnings] = useState(0); 

  // YETKİ KONTROLÜ
  const isAuthorized = ['Admin', 'Manager', 'Director', 'CEO'].includes(userData?.role);

  // 1. ADIM: AYARLARI DİNLE
  useEffect(() => {
    const unsubRules = subscribeToCommissionSettings((data) => {
      setRulesLoading(false); 
      if (data && data.retail) {
        setRules(data.retail);
        setPersonalTarget(data.retail.defaultPersonalTarget || 200000);
      } else {
        setRules(null); 
      }
    });
    return () => unsubRules();
  }, []);

  // 2. ADIM: VERİLERİ ÇEK VE FİLTRELE
  useEffect(() => {
    if (rulesLoading || !rules || !currentUser) return;

    const fetchData = async () => {
      setDataLoading(true);
      
      try {
        // A. Kendi verim
        const myData = await getStaffMonthlyData(currentUser.uid, currentDate);
        if (myData && myData.type === 'retail') { 
          setPersonalSales(Number(myData.personalSales) || 0);
        } else {
          setPersonalSales(0);
        }

        // B. TÜM EKİBİ VE AYLIK VERİLERİ ÇEK
        // getAllTeamMembers kullanıyoruz çünkü TeamSettings.jsx orada kayıt yapıyor.
        const [allUsers, monthlyData] = await Promise.all([
          getAllTeamMembers(), 
          getAllStaffMonthlyData(currentDate) 
        ]);

        // C. FİLTRELEME (GÜNCELLENDİ)
        // Departman ID'si veya İsmi içinde 'satis', 'sales', 'retail', 'magaza' geçenleri alıyoruz.
        const retailStaff = allUsers.filter(u => {
             const dept = u.department ? u.department.toLowerCase() : '';
             const role = u.role ? u.role.toLowerCase() : '';
             
             return (
                 dept.includes('satis') || 
                 dept.includes('satış') ||
                 dept.includes('sales') || 
                 dept.includes('retail') ||
                 dept.includes('magaza') ||
                 dept === 'store' ||
                 role === 'sales' // Rolü Sales olanları da dahil et
             );
        });

        // D. LİSTEYİ BİRLEŞTİR
        const mergedList = retailStaff.map(user => {
            const savedData = monthlyData.find(d => d.userEmail === user.email || d.id === user.uid);

            if (savedData) {
                return {
                    ...user, 
                    ...savedData,
                    // Eğer veritabanında isim güncellendiyse onu kullan, yoksa profil ismini kullan
                    userName: user.name || savedData.userName,
                    personalSales: Number(savedData.personalSales) || 0,
                    totalEarnings: Number(savedData.totalEarnings) || 0
                };
            } else {
                return {
                    id: user.uid || user.id,
                    userName: user.name || user.displayName || user.email,
                    userEmail: user.email,
                    avatarColor: user.avatarColor,
                    department: user.department,
                    personalSales: 0,
                    personalTarget: rules?.defaultPersonalTarget || 0,
                    personalSuccessRate: 0,
                    personalCommissionAmount: 0,
                    totalEarnings: 0
                };
            }
        });
        
        // Satışa göre sırala
        mergedList.sort((a, b) => (Number(b.personalSales) || 0) - (Number(a.personalSales) || 0));
        
        setAllStaffData(mergedList);

      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [rules, rulesLoading, currentDate, currentUser]); 

  // 3. HESAPLAMA MOTORU
  useEffect(() => {
    if (!rules) return;

    // A. Mağaza Toplamı (Kendim + Diğerleri)
    // Listede kendim varsam tekrar eklememek için filtreleme yapılır
    const storeTotal = allStaffData.reduce((sum, p) => sum + (Number(p.personalSales) || 0), 0);
    
    setStoreTotalSales(storeTotal);

    // B. Mağaza Hedef Durumu
    const storeTarget = rules.storeTarget || 1;
    const storeProgress = (storeTotal / storeTarget) * 100;
    setStoreTargetProgress(storeProgress);
    const targetMet = storeTotal >= storeTarget;
    setIsStoreTargetMet(targetMet);

    // C. Takım Bonusu
    const tBonus = targetMet ? Number(rules.storeBonusAmount) : 0;
    setTeamBonusAmount(tBonus);

    // D. Kişisel Başarı ve Prim
    const pTarget = rules.defaultPersonalTarget || 200000;
    const pSuccess = pTarget > 0 ? (Number(personalSales) / pTarget) * 100 : 0;
    setPersonalSuccessRate(pSuccess);

    let pRate = 0;
    if (rules.tiers) {
        const sortedTiers = [...rules.tiers].sort((a, b) => b.min - a.min);
        const matchedTier = sortedTiers.find(t => pSuccess >= t.min);
        if (matchedTier) pRate = matchedTier.rate;
    }
    setPersonalCommissionRate(pRate);

    // E. Tutarlar
    const pCommission = Number(personalSales) * (pRate / 100);
    setPersonalCommissionAmount(pCommission);
    setTotalEarnings(pCommission + tBonus);

  }, [personalSales, rules, allStaffData]);

  // 4. KAYDETME
  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        type: 'retail', 
        personalSales: Number(personalSales),
        personalTarget: Number(rules.defaultPersonalTarget),
        storeTotalSales, 
        personalSuccessRate,
        personalCommissionAmount,
        teamBonusAmount,
        totalEarnings,
        userName: userData?.name || 'Personel',
        userEmail: userData?.email,
        avatarColor: userData?.avatarColor,
        department: userData?.department || 'Mağaza Satış'
      };
      
      await saveStaffMonthlyData(currentUser.uid, currentDate, dataToSave);
      window.location.reload(); 
    } catch (error) {
      alert("Hata: " + error.message);
    }
    setSaving(false);
  };

  // --- UI RENDER ---

  if (rulesLoading) {
    return <div className="flex justify-center items-center h-96 text-slate-400"><Loader2 className="animate-spin mr-2"/> Sistem Ayarları Yükleniyor...</div>;
  }

  if (!rules) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-slate-500">
        <Store size={48} className="text-slate-300 mb-4"/>
        <h3 className="text-lg font-bold">Ayarlar Bulunamadı</h3>
        <p className="text-sm">Lütfen Yönetici Paneli &gt; Prim Ayarları kısmından Mağaza Satış kurallarını kaydedin.</p>
      </div>
    );
  }

  if (dataLoading) {
    return <div className="flex justify-center items-center h-96 text-slate-400"><Loader2 className="animate-spin mr-2"/> Veriler Yükleniyor...</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 pb-6 mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
             <Store size={32} className="text-emerald-600"/> Mağaza Satış Primleri
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Kolektif mağaza hedefi ve bireysel performans takibi.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
           <Calendar size={18} className="text-slate-400"/>
           <input 
             type="month" 
             value={currentDate} 
             onChange={(e) => setCurrentDate(e.target.value)}
             className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
           />
        </div>
      </div>

      {/* --- MAĞAZA HEDEFİ --- */}
      <div className="mb-8 relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl p-8">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 w-full">
               <div className="flex justify-between items-end mb-2">
                  <div>
                     <h3 className="text-emerald-400 font-bold uppercase text-xs tracking-widest mb-1 flex items-center gap-2">
                        <Users size={14}/> Mağaza Hedefi
                     </h3>
                     <div className="text-3xl md:text-4xl font-black tracking-tight">
                        {formatCurrency(storeTotalSales)} <span className="text-lg text-slate-500 font-medium">/ {formatCurrency(rules.storeTarget)}</span>
                     </div>
                  </div>
                  <div className="text-right">
                     <span className={`text-2xl font-black ${isStoreTargetMet ? 'text-emerald-400' : 'text-white'}`}>%{storeTargetProgress.toFixed(1)}</span>
                  </div>
               </div>
               <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
                  <div className={`h-full transition-all duration-1000 ease-out ${isStoreTargetMet ? 'bg-gradient-to-r from-emerald-500 to-green-300' : 'bg-gradient-to-r from-blue-600 to-emerald-500'}`} style={{width: `${Math.min(storeTargetProgress, 100)}%`}}></div>
               </div>
               <p className="text-xs text-slate-400 mt-2">{isStoreTargetMet ? "Hedef tuttu, bonus aktif! 🎉" : `Hedefe ${formatCurrency(rules.storeTarget - storeTotalSales)} kaldı.`}</p>
            </div>
            <div className={`flex-shrink-0 p-6 rounded-2xl border-2 flex flex-col items-center justify-center w-full md:w-auto transition-all ${isStoreTargetMet ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
               {isStoreTargetMet ? <Unlock size={32} className="mb-2 text-emerald-400 animate-bounce"/> : <Lock size={32} className="mb-2"/>}
               <span className="text-[10px] font-bold uppercase tracking-widest">Takım Bonusu</span>
               <span className={`text-2xl font-black ${isStoreTargetMet ? 'text-white' : 'text-slate-400'}`}>+{formatCurrency(rules.storeBonusAmount)}</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* SOL: KİŞİSEL GİRİŞ (1/3) */}
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><UserCheck size={20} className="text-blue-600"/> Kişisel Performans</h4>
               
               <div className="space-y-5">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Kişisel Satış (₺)</label>
                     <input 
                        type="number" 
                        className="w-full p-4 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                        value={personalSales}
                        onChange={(e) => setPersonalSales(Number(e.target.value))}
                     />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block flex justify-between">
                        <span>Kişisel Hedef (₺)</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 rounded flex items-center gap-1"><Lock size={8}/> Sabit</span>
                     </label>
                     <input 
                        type="number" 
                        disabled
                        className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-500 outline-none bg-slate-100 cursor-not-allowed"
                        value={rules.defaultPersonalTarget}
                     />
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                     <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Bireysel Başarı</span>
                        <span className="font-bold text-slate-800">%{personalSuccessRate.toFixed(1)}</span>
                     </div>
                     <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${personalSuccessRate >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{width: `${Math.min(personalSuccessRate, 100)}%`}}></div>
                     </div>
                  </div>

                  <button onClick={handleSave} disabled={saving} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-70">
                     {saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} {saving ? 'Verileri Kaydet' : 'Raporu Kaydet'}
                  </button>
               </div>
            </div>

            {/* Hakediş Kartı */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -mr-10 -mt-10"></div>
               <h4 className="font-bold text-slate-800 mb-4 relative z-10">Tahmini Hakediş</h4>
               <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-center text-sm"><span className="text-slate-500">Kişisel Prim (%{personalCommissionRate})</span><span className="font-bold text-blue-600">+{formatCurrency(personalCommissionAmount)}</span></div>
                  <div className="flex justify-between items-center text-sm"><span className="text-slate-500">Takım Bonusu</span><span className={`font-bold ${isStoreTargetMet ? 'text-emerald-600' : 'text-slate-300'}`}>{isStoreTargetMet ? '+' : ''}{formatCurrency(teamBonusAmount)}</span></div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center"><span className="font-black text-slate-800">TOPLAM</span><span className="font-black text-xl text-emerald-600">{formatCurrency(totalEarnings)}</span></div>
               </div>
            </div>
         </div>

         {/* SAĞ: EKİP LİSTESİ (2/3) - GİZLİLİK KORUMALI */}
         <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
               <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                     <h3 className="font-bold text-lg text-slate-800">Mağaza Ekibi Durumu</h3>
                     <p className="text-xs text-slate-500">Liste başarı sırasına göre düzenlenmiştir.</p>
                  </div>
                  <div className="flex items-center gap-2">
                     {!isAuthorized && <span className="text-[10px] flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-1 rounded"><EyeOff size={10}/> Gizlilik Modu</span>}
                     <div className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-500">{allStaffData.length} Personel</div>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                           <th className="px-6 py-4 w-10 text-center">#</th>
                           <th className="px-6 py-4">Personel</th>
                           <th className="px-6 py-4 text-center">Satış</th>
                           <th className="px-6 py-4 text-center">Hedef %</th>
                           <th className="px-6 py-4 text-center">Prim Oranı</th>
                           <th className="px-6 py-4 text-right">Toplam Kazanç</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {allStaffData.length > 0 ? allStaffData.map((p, i) => {
                           // Hesaplamalar
                           const pRate = p.personalTarget > 0 ? (Number(p.personalSales) / Number(p.personalTarget)) * 100 : 0;
                           const isMe = p.id === currentUser?.uid;
                           const canSeeDetails = isAuthorized || isMe;
                           
                           const hiddenContent = <span className="text-slate-300 font-mono tracking-widest text-xs select-none">••••••</span>;

                           return (
                              <tr key={i} className={`hover:bg-slate-50 ${isMe ? 'bg-blue-50/30' : ''}`}>
                                 <td className="px-6 py-4 text-center font-bold text-lg">{getRankBadge(i)}</td>
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${p.avatarColor || 'bg-slate-200 text-slate-600'}`}>
                                          {p.userName?.charAt(0)}
                                       </div>
                                       <div>
                                          <div className="font-bold text-slate-700 flex items-center gap-2">
                                             {p.userName} {isMe && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">SİZ</span>}
                                          </div>
                                          {/* Departman ID'sini daha okunaklı gösterme */}
                                          <div className="text-[10px] text-slate-400 capitalize">
                                            {p.department ? p.department.replace('_', ' ') : 'Personel'}
                                          </div>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 text-center font-bold text-slate-600">{canSeeDetails ? formatCurrency(p.personalSales) : hiddenContent}</td>
                                 <td className="px-6 py-4 text-center">
                                    {canSeeDetails ? (
                                       <div className="flex items-center justify-center gap-2">
                                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                             <div className={`h-full rounded-full ${pRate >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{width: `${Math.min(pRate, 100)}%`}}></div>
                                          </div>
                                          <span className="text-xs font-bold text-slate-500">%{pRate.toFixed(0)}</span>
                                       </div>
                                    ) : hiddenContent}
                                 </td>
                                 <td className="px-6 py-4 text-center">
                                    {canSeeDetails ? (
                                       <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold">
                                          {(Number(p.personalCommissionAmount) / (Number(p.personalSales) || 1) * 100).toFixed(1)}%
                                       </span>
                                    ) : hiddenContent}
                                 </td>
                                 <td className="px-6 py-4 text-right font-black text-emerald-600">
                                    {canSeeDetails ? formatCurrency(p.totalEarnings) : hiddenContent}
                                 </td>
                              </tr>
                           );
                        }) : (
                           <tr>
                              <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                 Bu departmanda listelenecek personel bulunamadı.
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CommissionRetail;