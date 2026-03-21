import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Truck, Clock, AlertTriangle, CheckCircle2, 
  Trophy, Activity, Calendar, Download, ChevronDown, 
  Timer, Zap, BarChart3, TrendingUp, Save, Loader2, EyeOff
} from 'lucide-react';

// FIREBASE SERVİSLERİ
import { subscribeToCommissionSettings } from '../../firebase/commissionSettingsService';
import { getStaffMonthlyData, saveStaffMonthlyData, getAllStaffMonthlyData } from '../../firebase/commissionDataService';
import { getAllTeamMembers } from '../../firebase/teamService';
import { useAuth } from '../../context/AuthContext'; 

// --- YARDIMCI: PARA FORMATI ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
};

// --- BİLEŞEN: PAKETLEME İSTASYON KARTI ---
const PackerCard = ({ person, rank, canSeeDetails }) => {
  // Hız Skoru (Hedef: Saatte 20 Paket - Varsayılan)
  const speedScore = Math.min((person.speed / 25) * 100, 100);
  // Kalite Skoru (100 - Hata Oranı * 10)
  const qualityScore = Math.max(0, 100 - (person.errorRate * 50)); 
  
  const hiddenContent = <span className="text-slate-300 tracking-widest text-xs">***</span>;

  return (
    <div className={`relative p-5 rounded-2xl border transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg ${person.isLeader ? 'bg-gradient-to-b from-white to-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
      
      {/* Sıralama */}
      <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${rank === 1 ? 'bg-yellow-400 text-yellow-900' : rank <= 3 ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
        #{rank}
      </div>

      <div className="flex justify-between items-start mb-4 pl-2">
        <div className="flex items-center gap-3">
           <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${person.isLeader ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {person.name?.charAt(0)}
           </div>
           <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1">
                 {person.name}
                 {person.errorRate === 0 && person.packages > 0 && <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded font-bold border border-green-200">HATASIZ</span>}
              </h4>
              <p className="text-[10px] text-slate-500 font-medium capitalize">{person.department ? person.department.replace('_', ' ') : 'Depo Operatörü'}</p>
           </div>
        </div>
        <div className="text-right">
           <span className="block text-[10px] text-slate-400 font-bold uppercase">HAKEDİŞ</span>
           <span className="text-xl font-black text-slate-800">
             {canSeeDetails ? formatCurrency(person.totalCommission) : '******'}
           </span>
        </div>
      </div>

      {/* Metrikler Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
         <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
            <div className="flex justify-center text-blue-500 mb-1"><Package size={16}/></div>
            <p className="text-lg font-black text-slate-800">{canSeeDetails ? person.packages : hiddenContent}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase">TOPLAM PAKET</p>
         </div>
         <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
            <div className="flex justify-center text-orange-500 mb-1"><Timer size={16}/></div>
            <p className="text-lg font-black text-slate-800">{canSeeDetails ? person.speed : hiddenContent}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase">PAKET / SAAT</p>
         </div>
      </div>

      {/* Performans Barları (Sadece detay yetkisi varsa doluluğu göster, yoksa gri) */}
      <div className="space-y-2">
         <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 w-8">HIZ</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 rounded-full" style={{width: canSeeDetails ? `${speedScore}%` : '0%'}}></div>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 w-8">KALİTE</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <div className={`h-full rounded-full ${person.errorRate > 1 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: canSeeDetails ? `${qualityScore}%` : '0%'}}></div>
            </div>
         </div>
      </div>
    </div>
  );
};

const OperationCommission = () => {
  const { currentUser, userData } = useAuth();

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 7));

  // Ayarlar (Varsayılanlar)
  const [rules, setRules] = useState({
      perPackageRate: 2.50,
      errorPenalty: 50,
      zeroErrorBonus: 500
  });

  // Kişisel Girdi
  const [myStats, setMyStats] = useState({
      packages: 0,
      hours: 0,
      errors: 0
  });

  // Tüm Ekip
  const [processedStaff, setProcessedStaff] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({ totalPackages: 0, avgSpeed: 0 });

  // Yetki Kontrolü
  const isAuthorized = ['Admin', 'Manager', 'Director', 'CEO', 'Operations Manager'].includes(userData?.role);

  // 1. VERİLERİ VE AYARLARI ÇEK
  useEffect(() => {
      // Ayarları dinle (Eğer veritabanında varsa)
      const unsubRules = subscribeToCommissionSettings((data) => {
          if (data && data.operation) {
              setRules({
                  perPackageRate: Number(data.operation.perPackageRate) || 2.50,
                  errorPenalty: Number(data.operation.errorPenalty) || 50,
                  zeroErrorBonus: Number(data.operation.zeroErrorBonus) || 500
              });
          }
      });
      return () => unsubRules();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // A. Kendi verimi çek
        if (currentUser) {
           const myData = await getStaffMonthlyData(currentUser.uid, currentDate);
           if (myData && myData.type === 'operation') {
               setMyStats({
                   packages: Number(myData.packages) || 0,
                   hours: Number(myData.hours) || 0,
                   errors: Number(myData.errors) || 0
               });
           } else {
               setMyStats({ packages: 0, hours: 0, errors: 0 });
           }
        }

        // B. Tüm ekibi çek
        const [allUsers, monthlyData] = await Promise.all([
            getAllTeamMembers(),
            getAllStaffMonthlyData(currentDate)
        ]);

        // C. Filtrele (Operasyon, Depo, Lojistik)
        const opStaff = allUsers.filter(u => {
            const dept = u.department ? u.department.toLowerCase() : '';
            const role = u.role ? u.role.toLowerCase() : '';
            return (
                dept.includes('operasyon') || 
                dept.includes('operation') ||
                dept.includes('depo') || 
                dept.includes('warehouse') ||
                dept.includes('lojistik') || 
                dept.includes('logistics') || 
                role === 'Operation'
            );
        });

        // D. Hesapla ve Birleştir
        const staffList = opStaff.map(user => {
            const saved = monthlyData.find(d => d.userEmail === user.email || d.id === user.uid);
            
            const packages = saved ? Number(saved.packages) : 0;
            const hours = saved ? Number(saved.hours) : 0;
            const errors = saved ? Number(saved.errors) : 0;

            const speed = hours > 0 ? parseFloat((packages / hours).toFixed(1)) : 0;
            const errorRate = packages > 0 ? parseFloat(((errors / packages) * 100).toFixed(2)) : 0;

            // Prim Hesabı (Ayarlara göre)
            const baseEarn = packages * rules.perPackageRate;
            // Bonus Kuralı: En az 100 paket ve 0 hata
            const bonus = (errors === 0 && packages > 100) ? rules.zeroErrorBonus : 0; 
            const penalty = errors * rules.errorPenalty;
            const totalCommission = Math.max(0, baseEarn + bonus - penalty);

            return {
                id: user.uid || user.id,
                name: user.name || user.displayName || 'Personel',
                department: user.department,
                avatarColor: user.avatarColor,
                packages,
                hours,
                errors,
                speed,
                errorRate,
                bonus,
                penalty,
                totalCommission,
                isLeader: false 
            };
        });

        // Lideri belirle (En çok paket yapan)
        staffList.sort((a, b) => b.totalCommission - a.totalCommission);
        if (staffList.length > 0 && staffList[0].totalCommission > 0) {
            staffList[0].isLeader = true;
        }

        setProcessedStaff(staffList);

        // Dashboard İstatistikleri
        const totalPkg = staffList.reduce((acc, curr) => acc + curr.packages, 0);
        const totalHrs = staffList.reduce((acc, curr) => acc + curr.hours, 0);
        const avgSpd = totalHrs > 0 ? (totalPkg / totalHrs).toFixed(1) : 0;
        setDashboardStats({ totalPackages: totalPkg, avgSpeed: avgSpd });

      } catch (error) {
          console.error("Veri çekme hatası:", error);
      } finally {
          setLoading(false);
      }
    };

    fetchData();
  }, [currentDate, currentUser, rules]); // Rules değişince de yeniden hesapla

  // --- KAYDETME ---
  const handleSave = async () => {
      setSaving(true);
      try {
          // Prim Hesabı (Kaydederken de güncel ayarlarla yapıyoruz)
          const baseEarn = myStats.packages * rules.perPackageRate;
          const bonus = (myStats.errors === 0 && myStats.packages > 100) ? rules.zeroErrorBonus : 0;
          const penalty = myStats.errors * rules.errorPenalty;
          const totalCommission = Math.max(0, baseEarn + bonus - penalty);

          const dataToSave = {
              type: 'operation',
              packages: Number(myStats.packages),
              hours: Number(myStats.hours),
              errors: Number(myStats.errors),
              totalCommission,
              userName: userData?.name || 'Personel',
              userEmail: userData?.email,
              avatarColor: userData?.avatarColor,
              department: userData?.department || 'Operasyon'
          };

          await saveStaffMonthlyData(currentUser.uid, currentDate, dataToSave);
          
          window.location.reload();
      } catch (error) {
          alert("Hata: " + error.message);
      }
      setSaving(false);
  };

  if (loading) return <div className="flex justify-center items-center h-96 text-slate-400"><Loader2 className="animate-spin mr-2"/> Veriler yükleniyor...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 font-sans">
      
      {/* 1. HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Operasyon Primleri</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Paketleme adedi, hız ve hatasızlık oranına dayalı hakediş.</p>
        </div>
        
        <div className="flex gap-3">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-500">Dönem:</span>
              <input 
                type="month" 
                value={currentDate} 
                onChange={(e) => setCurrentDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer"
              />
           </div>
           {/* Ayarlar Bilgisi (Read-Only) */}
           <div className="hidden md:flex gap-2">
              <div className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 bg-white" title="Paket Başı Ücret">
                 Pkt: {formatCurrency(rules.perPackageRate)}
              </div>
              <div className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 bg-white" title="Hatasızlık Bonusu">
                 Bonus: {formatCurrency(rules.zeroErrorBonus)}
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SOL: VERİ GİRİŞİ (Sadece Giriş Yapan Personel İçin) */}
          <div className="lg:col-span-4 space-y-6">
             {/* KİŞİSEL GİRİŞ KARTI */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><BarChart3 size={20} className="text-blue-600"/> Performans Girişi</h3>
                
                <div className="space-y-4">
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Toplam Paket</label>
                      <input 
                        type="number" 
                        className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-blue-500 transition"
                        value={myStats.packages}
                        onChange={(e) => setMyStats({...myStats, packages: Number(e.target.value)})}
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Çalışma Saati</label>
                         <input 
                           type="number" 
                           className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-blue-500 transition"
                           value={myStats.hours}
                           onChange={(e) => setMyStats({...myStats, hours: Number(e.target.value)})}
                         />
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block text-red-500">Hatalı Paket</label>
                         <input 
                           type="number" 
                           className="w-full p-3 border border-red-200 bg-red-50 rounded-xl font-bold text-red-600 outline-none focus:border-red-500 transition"
                           value={myStats.errors}
                           onChange={(e) => setMyStats({...myStats, errors: Number(e.target.value)})}
                         />
                      </div>
                   </div>

                   <button 
                     onClick={handleSave} 
                     disabled={saving}
                     className="w-full mt-2 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                   >
                      {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                      {saving ? 'Kaydediliyor...' : 'Raporu Kaydet'}
                   </button>
                </div>
             </div>

             {/* KOKPİT ÖZETİ (SOL TARAFTA) */}
             <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <h4 className="font-bold mb-6 relative z-10 flex items-center gap-2"><Activity size={18}/> Ekip Özeti</h4>
                <div className="space-y-4 relative z-10">
                   <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                      <span className="text-slate-400 text-xs font-bold uppercase">Toplam Paket</span>
                      <span className="text-xl font-black">{dashboardStats.totalPackages.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                      <span className="text-slate-400 text-xs font-bold uppercase">Ort. Hız</span>
                      <span className="text-xl font-black">{dashboardStats.avgSpeed} <span className="text-xs text-slate-500">/saat</span></span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-bold uppercase">Aktif Personel</span>
                      <span className="text-xl font-black">{processedStaff.length}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* SAĞ: LİSTE VE KARTLAR (Tüm Personel) */}
          <div className="lg:col-span-8 space-y-6">
             
             {/* ÜST KARTLAR (İlk 4 kişi - Liderler) */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processedStaff.slice(0, 4).map((person, i) => {
                   const isMe = person.id === currentUser?.uid;
                   const canSee = isAuthorized || isMe;
                   return <PackerCard key={person.id} person={person} rank={i+1} canSeeDetails={canSee} />;
                })}
             </div>

             {/* DETAYLI TABLO (Read-Only) */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                   <h3 className="font-bold text-slate-800">Tüm Operasyon Ekibi</h3>
                   <div className="flex items-center gap-2">
                       {!isAuthorized && <span className="text-[10px] flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-1 rounded"><EyeOff size={10}/> Gizlilik Modu</span>}
                       <div className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-500">{processedStaff.length} Personel</div>
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                         <tr>
                            <th className="px-6 py-4">Sıra</th>
                            <th className="px-6 py-4">Operatör</th>
                            <th className="px-6 py-4 text-center">Paket</th>
                            <th className="px-6 py-4 text-center">Hız</th>
                            <th className="px-6 py-4 text-center">Bonus/Ceza</th>
                            <th className="px-6 py-4 text-right">Net Hakediş</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {processedStaff.map((p, i) => {
                            const isMe = p.id === currentUser?.uid;
                            const canSee = isAuthorized || isMe;
                            const hiddenContent = <span className="text-slate-300 font-mono tracking-widest text-xs select-none">***</span>;

                            return (
                               <tr key={i} className={`hover:bg-slate-50 transition-colors ${isMe ? 'bg-blue-50/30' : ''}`}>
                                  <td className="px-6 py-4 text-center font-bold text-slate-400">
                                     {p.isLeader ? <Trophy size={16} className="text-yellow-500 mx-auto"/> : `#${i+1}`}
                                  </td>
                                  <td className="px-6 py-4 font-bold text-slate-700">
                                     <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${p.avatarColor || 'bg-slate-100 text-slate-500'}`}>
                                            {p.name?.charAt(0)}
                                        </div>
                                        <div>
                                            {p.name} {isMe && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded ml-1">SİZ</span>}
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-6 py-4 text-center font-mono">
                                     {canSee ? p.packages : hiddenContent}
                                  </td>
                                  <td className="px-6 py-4 text-center font-mono text-xs">
                                     {canSee ? p.speed : hiddenContent}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                     {canSee ? (
                                        <div className="flex flex-col text-[10px]">
                                           {p.bonus > 0 && <span className="text-green-600">+{formatCurrency(p.bonus)}</span>}
                                           {p.penalty > 0 && <span className="text-red-500">-{formatCurrency(p.penalty)}</span>}
                                           {p.bonus === 0 && p.penalty === 0 && <span className="text-slate-300">-</span>}
                                        </div>
                                     ) : hiddenContent}
                                  </td>
                                  <td className="px-6 py-4 text-right font-black text-slate-800 text-base">
                                     {canSee ? formatCurrency(p.totalCommission) : hiddenContent}
                                  </td>
                               </tr>
                            );
                         })}
                         {processedStaff.length === 0 && (
                             <tr><td colSpan="6" className="p-8 text-center text-slate-400">Bu departmanda personel bulunamadı.</td></tr>
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

export default OperationCommission;