import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Calendar, CheckCircle, XCircle, Clock, Filter, 
  Search, MoreHorizontal, User, FileText, PieChart, AlertCircle, 
  Trash2, ChevronRight, X, Edit, Save, RefreshCw, Loader2,
  AlertTriangle, Check
} from 'lucide-react';

// --- FIREBASE ENTEGRASYONU ---
import { useAuth } from '../../context/AuthContext';
import { isManagementRole } from '../../constants/roles';
import { subscribeToLeaves, addLeaveRequest, updateLeaveStatus, updateLeave, deleteLeaveRequest } from '../../firebase/leaveService';
import { getAllTeamMembers } from '../../firebase/teamService';
import { collection, getDocs } from 'firebase/firestore'; 
import { db } from '../../firebase/firebaseConfig';

const LeaveManager = () => {
  const { userData } = useAuth();
  const isManager = isManagementRole(userData?.role);

  // --- BİLDİRİM SİSTEMİ ---
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const showToast = (message, type = 'success') => {
    const id = `toast-${toastIdRef.current}`;
    toastIdRef.current += 1;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // --- STATE ---
  const [leaves, setLeaves] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [filterStatus, setFilterStatus] = useState('Tümü');
  const [filterType, setFilterType] = useState('Tümü');
  const [searchTerm, setSearchTerm] = useState('');

  const initialForm = { type: 'Yıllık İzin', start: '', end: '', reason: '' };
  const [formData, setFormData] = useState(initialForm);

  // --- VERİ ÇEKME & ENTEGRASYON ---
  useEffect(() => {
    const loadingFallbackTimer = setTimeout(() => setLoading(false), 2000);

    const fetchDependencies = async () => {
      try {
        // 1. Ekip Üyelerini Çek (İşe Başlama Tarihi için)
        const membersData = await getAllTeamMembers();
        setTeamMembers(membersData || []);

        // 2. Operasyon Ayarlarını Çek (İzin Kuralları)
        const settingsSnap = await getDocs(collection(db, 'settings'));
        let configData = {};
        settingsSnap.forEach(doc => { configData = { ...configData, ...doc.data() }; });

        setSettings({
          annualLeave1to5: Number(configData.annualLeave1to5) || 14,
          annualLeave5to15: Number(configData.annualLeave5to15) || 20,
          annualLeave15plus: Number(configData.annualLeave15plus) || 26,
          sickLeave: Number(configData.sickLeave) || 10,
          excuseLeave: Number(configData.excuseLeave) || 5,
          advanceNoticeDays: Number(configData.advanceNoticeDays) || 0,
          allowAdvanceLeave: configData.allowAdvanceLeave || false
        });

      } catch (error) {
        console.error("Bağımlılıklar çekilemedi:", error);
      }
    };

    fetchDependencies();

    // 3. İzinleri Dinle
    const unsubscribe = subscribeToLeaves(
      (data) => {
        setLeaves(data);
        setLoading(false);
      },
      { uid: userData?.uid, isManagement: isManager }
    );
    
    return () => {
      clearTimeout(loadingFallbackTimer);
      unsubscribe();
    };
  }, [userData, isManager]);

  // --- HESAPLAMALAR (KIDEM VE BAKİYE) ---
  
  // 1. Giriş Yapan Kişinin Kıdemini Hesapla
  const myProfile = useMemo(() => teamMembers.find(m => m.uid === userData?.uid), [teamMembers, userData]);
  
  const myTenureYears = useMemo(() => {
    if (!myProfile?.startDate) return 0;
    const diffTime = new Date() - new Date(myProfile.startDate);
    return diffTime > 0 ? diffTime / (1000 * 60 * 60 * 24 * 365.25) : 0;
  }, [myProfile]);

  // 2. Ayarlara Göre Kişisel İzin Haklarını Belirle
  const myEntitlements = useMemo(() => {
    if (!settings) return { 'Yıllık İzin': 0, 'Hastalık': 0, 'Mazeret': 0 };
    
    let annual = 0;
    if (myTenureYears >= 15) annual = settings.annualLeave15plus;
    else if (myTenureYears >= 5) annual = settings.annualLeave5to15;
    else if (myTenureYears >= 1) annual = settings.annualLeave1to5;
    // İş Kanunu'na göre 1 yıldan az çalışanların yıllık izin hakkı yoktur (0).

    return {
      'Yıllık İzin': annual,
      'Hastalık': settings.sickLeave,
      'Mazeret': settings.excuseLeave
    };
  }, [settings, myTenureYears]);

  // 3. Kullanılan İzinleri Hesapla (Sadece Logged-in User İçin)
  const myStats = useMemo(() => {
    const usage = { 'Yıllık İzin': 0, 'Hastalık': 0, 'Mazeret': 0, 'Ücretsiz İzin': 0 };
    
    leaves.forEach(leave => {
      if (leave.userId === userData?.uid && leave.status === 'Onaylandı' && usage[leave.type] !== undefined) {
        usage[leave.type] += leave.days;
      }
    });

    return [
      { label: 'Yıllık İzin', total: myEntitlements['Yıllık İzin'], used: usage['Yıllık İzin'], color: 'blue' },
      { label: 'Hastalık', total: myEntitlements['Hastalık'], used: usage['Hastalık'], color: 'red' },
      { label: 'Mazeret', total: myEntitlements['Mazeret'], used: usage['Mazeret'], color: 'orange' },
    ];
  }, [leaves, userData, myEntitlements]);

  // --- YARDIMCI FONKSİYONLAR ---
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e - s;
    if (diffTime < 0) return 0; 
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  };

  // --- CRUD İŞLEMLERİ ---
  const openNewModal = () => {
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (leave) => {
    setEditingId(leave.id);
    setFormData({ type: leave.type, start: leave.start, end: leave.end, reason: leave.reason });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.start || !formData.end || !formData.reason) return showToast("Lütfen tüm alanları doldurun.", "error");
    
    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (endDate < startDate) return showToast("Bitiş tarihi başlangıçtan önce olamaz!", "error");

    const requestedDays = calculateDays(formData.start, formData.end);

    // KURAL 1: Önceden Bildirim Şartı (Sadece Yıllık İzin için)
    if (formData.type === 'Yıllık İzin' && settings?.advanceNoticeDays > 0) {
        const diffDays = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays < settings.advanceNoticeDays) {
            return showToast(`Kurallar gereği Yıllık İzin talepleri en az ${settings.advanceNoticeDays} gün önceden yapılmalıdır.`, "error");
        }
    }

    // KURAL 2: Avans İzin (Eksi Bakiye) Kontrolü
    if (formData.type !== 'Ücretsiz İzin' && !settings?.allowAdvanceLeave) {
        const currentUsage = leaves
            .filter(l => l.userId === userData.uid && l.type === formData.type && l.status === 'Onaylandı' && l.id !== editingId)
            .reduce((acc, l) => acc + l.days, 0);
        
        const limit = myEntitlements[formData.type];
        if (currentUsage + requestedDays > limit) {
            return showToast(`Yeterli ${formData.type} bakiyeniz bulunmuyor. (Kalan: ${limit - currentUsage} Gün)`, "error");
        }
    }

    try {
        if (editingId) {
            await updateLeave(editingId, {
                type: formData.type, start: formData.start, end: formData.end,
                days: requestedDays, reason: formData.reason
            });
            showToast("İzin talebi güncellendi.");
        } else {
            await addLeaveRequest({
                userId: userData.uid,
                user: userData.name,
                role: userData.department || userData.role,
                avatar: userData.name.charAt(0).toUpperCase(),
                type: formData.type, start: formData.start, end: formData.end,
                days: requestedDays, reason: formData.reason
            });
            showToast("İzin talebi başarıyla oluşturuldu.");
        }
        setIsModalOpen(false);
    } catch (error) {
        showToast("İşlem başarısız: " + error.message, "error");
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
        await updateLeaveStatus(id, newStatus);
        const msg = newStatus === 'Onaylandı' ? 'İzin onaylandı.' : 'İzin reddedildi.';
        showToast(msg, newStatus === 'Onaylandı' ? 'success' : 'error');
    } catch { showToast("Durum güncellenemedi.", "error"); }
  };

  const handleDeleteLeave = async (id) => {
    if(window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
        try { await deleteLeaveRequest(id); showToast("Kayıt silindi.", "error"); } 
        catch { showToast("Silinemedi.", "error"); }
    }
  };

  // --- FİLTRELEME ---
  const filteredLeaves = leaves.filter(l => {
    if (!isManager && l.userId !== userData?.uid) return false;

    const matchStatus = filterStatus === 'Tümü' || l.status === filterStatus;
    const matchType = filterType === 'Tümü' || l.type === filterType;
    const matchSearch = l.user.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Onaylandı': return 'bg-green-100 text-green-700 border-green-200';
      case 'Reddedildi': return 'bg-red-100 text-red-700 border-red-200';
      case 'Bekliyor': return 'bg-yellow-100 text-yellow-700 border-yellow-200 animate-pulse';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center text-slate-400"><Loader2 className="animate-spin mr-2"/> İzin Kayıtları Yükleniyor...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* 1. ÜST BAKİYE KARTLARI (KİŞİSEL) */}
      <div>
         <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <User size={20} className="text-blue-500"/> Benim İzin Haklarım
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {myStats.map((stat, idx) => {
             const remaining = Math.max(0, stat.total - stat.used);
             const isOverdrawn = stat.used > stat.total; // Avans kullanım durumu
             const percent = stat.total > 0 ? Math.min(100, Math.round((stat.used / stat.total) * 100)) : 0;
             
             return (
               <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                        <h3 className={`text-3xl font-black mt-1 ${remaining < 3 ? 'text-orange-500' : 'text-slate-800'}`}>
                           {remaining} <span className="text-sm font-medium text-slate-400">Gün Kaldı</span>
                        </h3>
                        {isOverdrawn && <p className="text-[10px] text-red-500 font-bold mt-1 bg-red-50 px-2 py-0.5 rounded inline-block">Avans Kullanımda</p>}
                     </div>
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition`}>
                        <PieChart size={24}/>
                     </div>
                  </div>
                  <div>
                     <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                        <span>Kullanılan: {stat.used}</span>
                        <span>Toplam Hak: {stat.total}</span>
                     </div>
                     <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${isOverdrawn ? 'bg-red-500' : `bg-${stat.color}-500`}`} style={{width: `${isOverdrawn ? 100 : percent}%`}}></div>
                     </div>
                  </div>
               </div>
             )
           })}
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* 2. SOL PANEL: LİSTE VE GELİŞMİŞ FİLTRE */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[500px]">
           
           {/* Toolbar */}
           <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                 <div className="relative flex-1 sm:w-56">
                    <Search size={16} className="absolute left-3 top-2.5 text-slate-400"/>
                    <input 
                      className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl w-full text-sm outline-none focus:border-blue-500 bg-white shadow-sm" 
                      placeholder="Personel ara..."
                      value={searchTerm}
                      onChange={e=>setSearchTerm(e.target.value)}
                    />
                 </div>
                 
                 <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer outline-none focus:border-blue-500 shadow-sm" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                    <option value="Tümü">Tüm Durumlar</option>
                    <option value="Bekliyor">Bekleyenler</option>
                    <option value="Onaylandı">Onaylananlar</option>
                    <option value="Reddedildi">Reddedilenler</option>
                 </select>

                 <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer outline-none focus:border-blue-500 shadow-sm" value={filterType} onChange={e=>setFilterType(e.target.value)}>
                    <option value="Tümü">Tüm Türler</option>
                    <option value="Yıllık İzin">Yıllık İzin</option>
                    <option value="Hastalık">Hastalık</option>
                    <option value="Mazeret">Mazeret</option>
                    <option value="Ücretsiz İzin">Ücretsiz İzin</option>
                 </select>

                 {(filterStatus !== 'Tümü' || filterType !== 'Tümü' || searchTerm) && (
                    <button onClick={()=>{setFilterStatus('Tümü'); setFilterType('Tümü'); setSearchTerm('')}} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"><RefreshCw size={16}/></button>
                 )}
              </div>
              <button onClick={openNewModal} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all w-full sm:w-auto justify-center">
                 <Plus size={16}/> İzin Talep Et
              </button>
           </div>

           {/* Liste */}
           <div className="flex-1 overflow-x-auto p-0 custom-scrollbar">
              <table className="w-full text-sm text-left whitespace-nowrap">
                 <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                       <th className="px-6 py-4">Personel</th>
                       <th className="px-6 py-4">İzin Türü</th>
                       <th className="px-6 py-4">Tarih Aralığı</th>
                       <th className="px-6 py-4 text-center">Süre</th>
                       <th className="px-6 py-4 text-center">Durum</th>
                       <th className="px-6 py-4 text-right">İşlem</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {filteredLeaves.length > 0 ? filteredLeaves.map(leave => (
                       <tr key={leave.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs border border-white shadow-sm">{leave.avatar}</div>
                                <div><div className="font-bold text-slate-800">{leave.user}</div><div className="text-[10px] text-slate-400">{leave.role}</div></div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                              <span className="text-slate-700 font-bold text-sm">{leave.type}</span>
                              <div className="text-[11px] text-slate-400 mt-0.5 max-w-[180px] truncate" title={leave.reason}>{leave.reason}</div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                              <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 inline-flex">
                                  <span>{new Date(leave.start).toLocaleDateString('tr-TR', {day:'numeric', month:'short'})}</span>
                                  <ChevronRight size={12} className="text-slate-300"/>
                                  <span>{new Date(leave.end).toLocaleDateString('tr-TR', {day:'numeric', month:'short'})}</span>
                              </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                              <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded text-xs font-bold">{leave.days} Gün</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(leave.status)}`}>{leave.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-1">
                                {leave.status === 'Bekliyor' && isManager && (
                                   <>
                                      <button onClick={() => handleUpdateStatus(leave.id, 'Onaylandı')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition border border-transparent hover:border-green-200" title="Onayla"><CheckCircle size={18}/></button>
                                      <button onClick={() => handleUpdateStatus(leave.id, 'Reddedildi')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-200" title="Reddet"><XCircle size={18}/></button>
                                   </>
                                )}
                                
                                {((leave.userId === userData?.uid && leave.status === 'Bekliyor') || isManager) && (
                                   <>
                                      {leave.status === 'Bekliyor' && <button onClick={() => openEditModal(leave)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-200" title="Düzenle"><Edit size={18}/></button>}
                                      <button onClick={() => handleDeleteLeave(leave.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition border border-transparent hover:border-slate-200" title="Sil"><Trash2 size={18}/></button>
                                   </>
                                )}
                             </div>
                          </td>
                       </tr>
                    )) : (
                       <tr><td colSpan="6" className="p-12 text-center text-slate-400"><div className="flex flex-col items-center"><Calendar size={32} className="mb-2 opacity-20"/><p>Kayıt bulunamadı.</p></div></td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* 3. SAĞ PANEL: YAKLAŞAN İZİNLER */}
        <div className="w-full lg:w-80 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto hidden lg:block">
           <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Clock size={18} className="text-blue-500"/> Yaklaşan İzinler</h3>
           <div className="space-y-5">
              {leaves
                .filter(l => l.status === 'Onaylandı' && new Date(l.start) >= new Date(new Date().setHours(0,0,0,0)))
                .sort((a,b) => new Date(a.start) - new Date(b.start))
                .slice(0, 5).map((l, i) => (
                 <div key={i} className="relative pl-5 border-l-2 border-slate-100">
                    <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-[3px] border-white shadow-sm"></div>
                    <p className="text-[10px] text-blue-500 font-black uppercase tracking-wider mb-1.5">{new Date(l.start).toLocaleDateString('tr-TR', {day:'numeric', month:'long'})}</p>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                       <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">{l.avatar}</div>
                          <span className="text-sm font-bold text-slate-700">{l.user}</span>
                       </div>
                       <p className="text-xs text-slate-500 font-medium">{l.type} <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] ml-1">{l.days} Gün</span></p>
                    </div>
                 </div>
              ))}
              {leaves.filter(l => l.status === 'Onaylandı' && new Date(l.start) >= new Date()).length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">Yaklaşan onaylı izin yok.</p>}
           </div>

           <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 relative overflow-hidden">
                 <div className="absolute -right-4 -top-4 text-blue-200 opacity-40"><Calendar size={100}/></div>
                 <h4 className="text-blue-900 font-black text-sm mb-1 relative z-10">Resmi Tatil</h4>
                 <p className="text-blue-700 text-xs font-medium relative z-10">23 Nisan Ulusal Egemenlik ve Çocuk Bayramı</p>
              </div>
           </div>
        </div>

      </div>

      {/* MODAL: YENİ TALEP / DÜZENLEME */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                 {editingId ? <Edit size={20} className="text-blue-500"/> : <Plus size={20} className="text-blue-500"/>}
                 {editingId ? 'Talebi Düzenle' : 'İzin Talebi Oluştur'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition"><X size={20} className="text-slate-400 hover:text-red-500"/></button>
            </div>
            <div className="p-6 space-y-5">
               
               {/* Uyarı Bildirimi */}
               {formData.type === 'Yıllık İzin' && settings?.advanceNoticeDays > 0 && (
                  <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl flex items-start gap-2 text-orange-800 text-xs font-medium">
                     <AlertCircle size={14} className="mt-0.5 flex-shrink-0"/>
                     <p>Kurallar gereği yıllık izin taleplerinizi en az <b>{settings.advanceNoticeDays} gün önceden</b> sisteme girmelisiniz.</p>
                  </div>
               )}

               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">İzin Türü</label>
                  <select 
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm font-medium outline-none bg-white cursor-pointer focus:border-blue-500 transition shadow-sm" 
                    value={formData.type} 
                    onChange={e=>setFormData({...formData, type: e.target.value})}
                  >
                     <option>Yıllık İzin</option>
                     <option>Hastalık</option>
                     <option>Mazeret</option>
                     <option>Ücretsiz İzin</option>
                  </select>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Başlangıç</label>
                     <input type="date" className="w-full border border-slate-300 rounded-xl p-3 text-sm font-medium outline-none focus:border-blue-500 transition shadow-sm" value={formData.start} onChange={e=>setFormData({...formData, start: e.target.value})}/>
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Bitiş</label>
                     <input type="date" className="w-full border border-slate-300 rounded-xl p-3 text-sm font-medium outline-none focus:border-blue-500 transition shadow-sm" value={formData.end} onChange={e=>setFormData({...formData, end: e.target.value})}/>
                  </div>
               </div>
               
               {formData.start && formData.end && (
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-bold">
                     <span className="flex items-center gap-2"><Calendar size={16} className="text-slate-400"/> Toplam Süre:</span>
                     <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-blue-600 shadow-sm">{calculateDays(formData.start, formData.end)} Gün</span>
                  </div>
               )}

               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Açıklama / Mazeret</label>
                  <textarea rows="3" className="w-full border border-slate-300 rounded-xl p-3 text-sm font-medium outline-none resize-none focus:border-blue-500 transition shadow-sm" placeholder="İzin sebebi (Opsiyonel)" value={formData.reason} onChange={e=>setFormData({...formData, reason: e.target.value})}></textarea>
               </div>
               
               <button onClick={handleSave} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg mt-2 flex justify-center items-center gap-2">
                  <Check size={18}/> {editingId ? 'Güncellemeyi Kaydet' : 'Talebi Gönder'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST BİLDİRİMLERİ */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 pointer-events-none z-[100]">
        {toasts.map(t=><div key={t.id} className={`pointer-events-auto px-4 py-3 rounded-xl shadow-2xl text-sm font-bold text-white flex items-center gap-2 animate-in slide-in-from-right ${t.type==='error'?'bg-red-500':'bg-slate-900'}`}>{t.type === 'error' ? <AlertCircle size={16}/> : <CheckCircle size={16}/>} {t.message}</div>)}
      </div>
    </div>
  );
};

export default LeaveManager;
