import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, LogIn, LogOut, Calendar, User, Search, Filter, 
  AlertCircle, CheckCircle, MoreHorizontal, Plus, X,
  Coffee, PlayCircle, Briefcase, RefreshCw, Loader2,
  ChevronLeft, ChevronRight // Sayfalama için eklendi
} from 'lucide-react';

// FIREBASE
import { useAuth } from '../../context/AuthContext';
import { subscribeToShifts, getTodayShiftByUser, checkIn, updateShift } from '../../firebase/shiftService';
import { getDepartments } from '../../firebase/teamService';
import { collection, getDocs } from 'firebase/firestore'; 
import { db } from '../../firebase/firebaseConfig';

const ShiftManager = () => {
  const { userData } = useAuth();
  const isManager = ['Admin', 'Manager', 'CEO', 'Director'].includes(userData?.role);

  // --- DİNAMİK OPERASYON AYARLARI ---
  const [opSettings, setOpSettings] = useState({
    workStart: "09:00",
    workEnd: "18:00",
    lateTolerance: 0,
    dailyBreakLimit: 60,
    autoDeductBreak: false
  });

  // --- STATE ---
  const [shifts, setShifts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [myTodayShift, setMyTodayShift] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // FİLTRE STATE
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterRole, setFilterRole] = useState('Tümü');
  const [filterStatus, setFilterStatus] = useState('Tümü');

  // SAYFALAMA STATE (YENİ EKLENDİ)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Sayfa başına gösterilecek kayıt sayısı

  const [newEntry, setNewEntry] = useState({ user: '', date: new Date().toISOString().split('T')[0], checkIn: '', checkOut: '' });

  // --- VERİ YÜKLEME ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const fetchData = async () => {
        try {
            const depts = await getDepartments();
            setDepartments(depts || []);

            const settingsSnap = await getDocs(collection(db, 'settings'));
            let configData = {};
            settingsSnap.forEach(doc => { configData = { ...configData, ...doc.data() }; });

            setOpSettings({
                workStart: configData.workStart || configData.mesaiBaslangic || configData.startTime || "09:00",
                workEnd: configData.workEnd || configData.mesaiBitis || configData.endTime || "18:00",
                lateTolerance: Number(configData.lateTolerance || configData.gecKalmaToleransi || configData.tolerance) || 0,
                dailyBreakLimit: Number(configData.dailyBreakLimit || configData.gunlukMolaHakki || configData.molaHakki || configData.breakTime) || 60,
                autoDeductBreak: configData.autoDeductBreak || configData.otomatikMolaDus || configData.autoBreak || false
            });

        } catch(e) { console.error(e); }

        const unsub = subscribeToShifts(
          (data) => {
            setShifts(data || []);
            setLoading(false);
          },
          { uid: userData?.uid, isManagement: isManager }
        );
        return () => unsub();
    };
    fetchData();
    return () => clearInterval(timer);
  }, [userData, isManager]);

  useEffect(() => {
    const checkMyShift = async () => {
        if(userData?.uid) {
            const myShift = await getTodayShiftByUser(userData.uid);
            setMyTodayShift(myShift);
        }
    };
    checkMyShift();
  }, [userData, shifts]); 

  // --- HESAPLAMALAR ---
  const getMinutesDiff = (time1, time2) => {
    if (!time1 || !time2 || time1 === '-' || time2 === '-') return 0;
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    return (h1 * 60 + m1) - (h2 * 60 + m2);
  };

  const calculateTotalBreak = (breaks) => {
    if (!breaks || breaks.length === 0) return 0;
    return breaks.reduce((total, brk) => {
      if (brk.end === '-') return total; 
      return total + Math.abs(getMinutesDiff(brk.end, brk.start));
    }, 0);
  };

  const calculateLate = (checkInTime) => {
    const diff = getMinutesDiff(checkInTime, opSettings.workStart);
    return diff > opSettings.lateTolerance ? diff : 0;
  };

  const calculateOvertime = (checkOutTime) => {
    const diff = getMinutesDiff(checkOutTime, opSettings.workEnd);
    return diff > 0 ? diff : 0;
  };

  const formatDuration = (minutes) => {
    if (minutes <= 0) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? h + 'sa ' : ''}${m}dk`;
  };

  // Filtre değiştiğinde sayfalama 1'e dönsün
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate, filterRole, filterStatus]);

  // --- AKILLI FİLTRELEME (DEPARTMAN FIX EKLENDİ) ---
  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      if (!isManager && shift.userId !== userData?.uid) return false;

      const matchesSearch = shift.user.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !filterDate || shift.date === filterDate;
      
      // AKILLI DEPARTMAN KONTROLÜ (Hem ID hem Label kontrol eder)
      let matchesRole = true;
      if (filterRole !== 'Tümü') {
          const shiftRoleLabel = departments.find(d => d.id === shift.role)?.label || shift.role;
          matchesRole = (shift.role === filterRole) || (shiftRoleLabel === filterRole);
      }

      let matchesStatus = true;
      if (filterStatus !== 'Tümü') {
        if (filterStatus === 'Geç Kalan') matchesStatus = calculateLate(shift.checkIn) > 0;
        else if (filterStatus === 'Mesai') matchesStatus = calculateOvertime(shift.checkOut) > 0;
        else matchesStatus = shift.status === filterStatus;
      }

      return matchesSearch && matchesDate && matchesRole && matchesStatus;
    });
  }, [shifts, searchTerm, filterDate, filterRole, filterStatus, isManager, userData, opSettings, departments]);

  // --- SAYFALAMA HESAPLAMALARI ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredShifts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredShifts.length / itemsPerPage);

  // --- AKSİYONLAR ---
  const handleMyAction = async (action) => {
    if(isActionLoading) return;
    setIsActionLoading(true);
    const nowTime = currentTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
    const today = new Date().toISOString().split('T')[0];

    try {
        if(action === 'in') {
            const isLate = calculateLate(nowTime) > 0;
            await checkIn({
                userId: userData.uid,
                user: userData.name,
                role: userData.department || userData.role || 'Personel',
                avatar: userData.name.charAt(0).toUpperCase(),
                date: today,
                checkIn: nowTime,
                checkOut: '-',
                breaks: [],
                status: 'İçeride',
                note: isLate ? `Geç Kaldı (${opSettings.workStart} mesaisi)` : ''
            });
        } 
        else if (action === 'out' && myTodayShift) {
            await updateShift(myTodayShift.id, { checkOut: nowTime, status: 'Tamamlandı' });
        } 
        else if (action === 'break-start' && myTodayShift) {
            const newBreak = { start: nowTime, end: '-', type: 'Mola' };
            await updateShift(myTodayShift.id, { status: 'Molada', breaks: [...(myTodayShift.breaks || []), newBreak] });
        } 
        else if (action === 'break-end' && myTodayShift) {
            const updatedBreaks = [...(myTodayShift.breaks || [])];
            if(updatedBreaks.length > 0) updatedBreaks[updatedBreaks.length - 1].end = nowTime;
            await updateShift(myTodayShift.id, { status: 'İçeride', breaks: updatedBreaks });
        }
    } catch (error) {
        alert("İşlem başarısız: " + error.message);
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleManualAdd = async () => {
    if(!newEntry.user || !newEntry.date || !newEntry.checkIn) return alert("Kullanıcı, tarih ve giriş saati zorunlu.");
    try {
        await checkIn({
            userId: 'manuel-entry', 
            user: newEntry.user,
            role: 'Manuel',
            avatar: newEntry.user.charAt(0).toUpperCase(),
            date: newEntry.date,
            checkIn: newEntry.checkIn,
            checkOut: newEntry.checkOut || '-',
            breaks: [],
            status: newEntry.checkOut ? 'Tamamlandı' : 'İçeride',
            note: 'Yönetici tarafından eklendi'
        });
        setIsModalOpen(false);
        setNewEntry({ user: '', date: new Date().toISOString().split('T')[0], checkIn: '', checkOut: '' });
    } catch (error) {
        alert("Ekleme hatası: " + error.message);
    }
  };

  let myStatusUI = 'Dışarıda';
  if(myTodayShift) myStatusUI = myTodayShift.status; 

  if (loading) return <div className="flex h-96 items-center justify-center text-slate-400"><Loader2 className="animate-spin mr-2"/> Kayıtlar Yüklendi...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. KONTROL PANELİ */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10"><Clock size={120}/></div>
           <div className="flex justify-between items-start z-10">
              <div>
                 <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                 <h1 className="text-5xl font-black mt-2 font-mono tracking-tighter">{currentTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</h1>
                 <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700 text-blue-300"><Clock size={12}/> Mesai: {opSettings.workStart} - {opSettings.workEnd}</span>
                    <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700 text-orange-300"><AlertCircle size={12}/> Tolerans: {opSettings.lateTolerance} dk</span>
                    {opSettings.autoDeductBreak && <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700 text-green-300"><Coffee size={12}/> Oto Mola Düşümü</span>}
                 </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                  <span className={`px-3 py-1 rounded text-xs font-bold border ${myStatusUI === 'İçeride' ? 'bg-green-500/20 border-green-500 text-green-400' : myStatusUI === 'Molada' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : myStatusUI === 'Tamamlandı' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                      DURUM: {myStatusUI.toUpperCase()}
                  </span>
              </div>
           </div>
           
           <div className="flex flex-wrap gap-3 mt-8 z-10">
              {myStatusUI === 'Dışarıda' && ( <button disabled={isActionLoading} onClick={() => handleMyAction('in')} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all">{isActionLoading ? <Loader2 size={20} className="animate-spin"/> : <LogIn size={20}/>} Giriş Yap</button> )}
              {myStatusUI === 'İçeride' && ( <><button disabled={isActionLoading} onClick={() => handleMyAction('break-start')} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all">{isActionLoading ? <Loader2 size={20} className="animate-spin"/> : <Coffee size={20}/>} Mola Ver</button><button disabled={isActionLoading} onClick={() => handleMyAction('out')} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all">{isActionLoading ? <Loader2 size={20} className="animate-spin"/> : <LogOut size={20}/>} Çıkış Yap</button></> )}
              {myStatusUI === 'Molada' && ( <button disabled={isActionLoading} onClick={() => handleMyAction('break-end')} className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all">{isActionLoading ? <Loader2 size={20} className="animate-spin"/> : <PlayCircle size={20}/>} Moladan Dön</button> )}
              {myStatusUI === 'Tamamlandı' && ( <div className="flex-1 bg-slate-800/50 py-3 rounded-xl text-center text-sm font-medium text-slate-400">Bugünkü mesainizi tamamladınız.</div> )}
           </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4">
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
               <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-2"><User size={16}/> {filterDate === new Date().toISOString().split('T')[0] ? 'Şu An İçeride' : 'Giriş Yapan'}</div>
               <div className="text-3xl font-black text-slate-800">{filteredShifts.filter(s => s.status === 'İçeride' || s.status === 'Tamamlandı').length} <span className="text-sm font-medium text-slate-400">Kişi</span></div>
           </div>
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
               <div className="flex items-center gap-2 text-orange-500 text-xs font-bold uppercase mb-2"><Coffee size={16}/> Molada</div>
               <div className="text-3xl font-black text-slate-800">{filteredShifts.filter(s => s.status === 'Molada').length} <span className="text-sm font-medium text-slate-400">Kişi</span></div>
           </div>
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
               <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase mb-2"><AlertCircle size={16}/> Geç Kalan</div>
               <div className="text-3xl font-black text-slate-800">{filteredShifts.filter(s => calculateLate(s.checkIn) > 0).length}</div>
           </div>
           
           {isManager ? (
               <div onClick={() => setIsModalOpen(true)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center cursor-pointer hover:bg-slate-50 transition border-dashed">
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-2"><Plus size={24}/></div>
                   <span className="text-xs font-bold text-slate-600">Manuel Ekle</span>
               </div>
           ) : (
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center opacity-50">
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-2"><CheckCircle size={24}/></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase">Sistem Aktif</span>
               </div>
           )}
        </div>
      </div>

      {/* --- 2. GELİŞMİŞ FİLTRE BAR --- */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
         <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400"/>
            <input className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg w-full text-sm outline-none focus:border-blue-500" placeholder="Personel ara..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
         </div>
         <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50">
               <Calendar size={14} className="text-slate-500"/>
               <input type="date" className="bg-transparent text-sm text-slate-700 font-bold outline-none" value={filterDate} onChange={e=>setFilterDate(e.target.value)}/>
            </div>
            <div className="relative">
               <select className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-700 cursor-pointer hover:border-blue-400 outline-none" value={filterRole} onChange={e=>setFilterRole(e.target.value)}>
                  <option value="Tümü">Tüm Departmanlar</option>
                  {departments.map(d => <option key={d.id} value={d.label}>{d.label}</option>)}
               </select>
               <Briefcase size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none"/>
            </div>
            <div className="relative">
               <select className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-700 cursor-pointer hover:border-blue-400 outline-none" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                  <option value="Tümü">Tüm Durumlar</option><option value="İçeride">İçeride</option><option value="Molada">Molada</option><option value="Tamamlandı">Tamamlandı</option><hr/><option value="Geç Kalan">Geç Kalanlar</option><option value="Mesai">Mesaiye Kalanlar</option>
               </select>
               <Filter size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none"/>
            </div>
            <button onClick={() => {setFilterDate(''); setFilterRole('Tümü'); setFilterStatus('Tümü'); setSearchTerm('');}} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Filtreleri Temizle"><RefreshCw size={16}/></button>
         </div>
      </div>

      {/* 3. ANA TABLO (SAYFALAMALI) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
         <div className="overflow-x-auto">
             <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                   <tr>
                      <th className="px-5 py-3">Personel</th>
                      <th className="px-5 py-3 text-center">Tarih</th>
                      <th className="px-5 py-3 text-center">Giriş / Çıkış</th>
                      <th className="px-5 py-3 text-center">Mola</th>
                      <th className="px-5 py-3 text-center">Net Çalışma</th>
                      <th className="px-5 py-3 text-center">Performans</th>
                      <th className="px-5 py-3 text-center">Durum</th>
                      <th className="px-5 py-3 text-right">Not</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {currentItems.length > 0 ? (
                      currentItems.map(shift => {
                         const late = calculateLate(shift.checkIn);
                         const overtime = calculateOvertime(shift.checkOut);
                         let manualBreak = calculateTotalBreak(shift.breaks);
                         
                         let netWork = 0;
                         let totalBreakToDisplay = manualBreak;

                         if(shift.checkOut !== '-') {
                            const totalStay = getMinutesDiff(shift.checkOut, shift.checkIn);
                            if (opSettings.autoDeductBreak) {
                                const deductedBreak = Math.max(manualBreak, opSettings.dailyBreakLimit);
                                netWork = totalStay - deductedBreak;
                                totalBreakToDisplay = deductedBreak;
                            } else {
                                netWork = totalStay - manualBreak;
                            }
                         }

                         // Tabloda Departman Label'ını göstermek için
                         const displayRole = departments.find(d => d.id === shift.role)?.label || shift.role;

                         return (
                            <tr key={shift.id} className="hover:bg-slate-50 transition-colors">
                               <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-[10px] border-2 border-white shadow-sm">{shift.avatar}</div>
                                     <div><div className="font-bold text-slate-800 text-sm">{shift.user}</div><div className="text-[10px] text-slate-400">{displayRole}</div></div>
                                  </div>
                               </td>
                               <td className="px-5 py-3 text-center text-slate-500 text-xs font-medium">
                                   {new Date(shift.date).toLocaleDateString('tr-TR', {day:'numeric', month:'short'})}
                               </td>
                               <td className="px-5 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                     <span className={`font-mono font-bold text-xs ${late > 0 ? 'text-red-500' : 'text-slate-700'}`}>{shift.checkIn}</span>
                                     <span className="text-[10px] text-slate-300">-</span>
                                     <span className="font-mono font-bold text-xs text-slate-500">{shift.checkOut}</span>
                                  </div>
                               </td>
                               <td className="px-5 py-3 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-600 font-medium text-xs">
                                        <div className="flex items-center gap-1"><Coffee size={12} className="text-orange-400"/> {formatDuration(totalBreakToDisplay)}</div>
                                        {opSettings.autoDeductBreak && shift.checkOut !== '-' && ( <span className="text-[9px] text-slate-400 mt-0.5">Oto Düşüm</span> )}
                                    </div>
                               </td>
                               <td className="px-5 py-3 text-center text-xs">{netWork > 0 ? <span className="font-bold text-blue-600">{formatDuration(netWork)}</span> : <span className="text-slate-400">-</span>}</td>
                               <td className="px-5 py-3 text-center">
                                  <div className="flex flex-col gap-1 items-center">
                                     {late > 0 && <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">+{late}dk Geç</span>}
                                     {overtime > 0 && <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold uppercase">+{formatDuration(overtime)} Mesai</span>}
                                     {late === 0 && overtime === 0 && <span className="text-slate-300">-</span>}
                                  </div>
                               </td>
                               <td className="px-5 py-3 text-center">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${
                                     shift.status === 'İçeride' ? 'bg-green-50 text-green-700 border-green-200' :
                                     shift.status === 'Molada' ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse' :
                                     shift.status === 'Gelmedi' ? 'bg-red-50 text-red-700 border-red-200' :
                                     'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>{shift.status}</span>
                               </td>
                               <td className="px-5 py-3 text-right">
                                  {shift.note ? <span className="text-[10px] text-slate-500 font-medium flex items-center justify-end gap-1"><AlertCircle size={10} className="text-orange-400"/> {shift.note}</span> : <span className="text-slate-300">-</span>}
                               </td>
                            </tr>
                         );
                      })
                   ) : (
                      <tr><td colSpan="8" className="p-8 text-center text-slate-400">Kriterlere uygun kayıt bulunamadı.</td></tr>
                   )}
                </tbody>
             </table>
         </div>

         {/* --- SAYFALAMA KONTROLLERİ --- */}
         {filteredShifts.length > itemsPerPage && (
             <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-sm">
                 <span className="text-slate-500 font-medium">Toplam <span className="font-bold text-slate-800">{filteredShifts.length}</span> kayıttan <span className="font-bold text-slate-800">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredShifts.length)}</span> arası</span>
                 <div className="flex items-center gap-2">
                     <button 
                         onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                         disabled={currentPage === 1}
                         className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition shadow-sm"
                     >
                         <ChevronLeft size={16}/>
                     </button>
                     <span className="font-bold text-slate-700 px-2">{currentPage} / {totalPages}</span>
                     <button 
                         onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                         disabled={currentPage === totalPages || totalPages === 0}
                         className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition shadow-sm"
                     >
                         <ChevronRight size={16}/>
                     </button>
                 </div>
             </div>
         )}
      </div>

      {/* MODAL: MANUEL EKLEME */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
               <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-800">Manuel Kayıt Ekle</h3>
                  <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-red-500"/></button>
               </div>
               <div className="p-6 space-y-4">
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Personel Adı</label>
                      <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" value={newEntry.user} onChange={e=>setNewEntry({...newEntry, user: e.target.value})}/>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tarih</label>
                      <input type="date" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" value={newEntry.date} onChange={e=>setNewEntry({...newEntry, date: e.target.value})}/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Giriş Saati</label>
                         <input type="time" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" value={newEntry.checkIn} onChange={e=>setNewEntry({...newEntry, checkIn: e.target.value})}/>
                     </div>
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Çıkış Saati</label>
                         <input type="time" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" value={newEntry.checkOut} onChange={e=>setNewEntry({...newEntry, checkOut: e.target.value})}/>
                     </div>
                  </div>
                  <button onClick={handleManualAdd} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold mt-2 hover:bg-slate-800 transition shadow-lg">Kaydı Oluştur</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ShiftManager;
