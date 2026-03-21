// src/components/settings/team/TeamSettings.jsx dosyasının EN ÜST KISMI
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Trash2, 
  X, Briefcase, Edit2, Shield, 
  LayoutDashboard, Percent, BarChart3, Settings, Save,
  Loader2, Plus, Lock, CalendarDays, IdCard, Download,
  ChevronLeft, ChevronRight, UserCheck, UserMinus, AlertTriangle,
  Clock // <-- BU KELİMEYİ BURAYA EKLEYİN (VİRGÜLÜ UNUTMAYIN)
} from 'lucide-react';

import { 
  addTeamMember, getAllTeamMembers, updateTeamMember, deleteTeamMember,
  getDepartments, saveDepartments 
} from '../../../firebase/teamService';

const ROLES = ['Admin', 'Manager', 'Personel', 'Editor'];

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-pink-100 text-pink-600', 
  'bg-orange-100 text-orange-600', 'bg-green-100 text-green-600', 'bg-teal-100 text-teal-600'
];

const DEPARTMENT_COLORS = [
  { label: 'Mavi', value: 'bg-blue-100 text-blue-700' },
  { label: 'Mor', value: 'bg-purple-100 text-purple-700' },
  { label: 'Yeşil', value: 'bg-emerald-100 text-emerald-700' },
  { label: 'Turuncu', value: 'bg-orange-100 text-orange-700' },
  { label: 'Sarı', value: 'bg-amber-100 text-amber-700' },
  { label: 'Gri', value: 'bg-slate-100 text-slate-700' },
  { label: 'Kırmızı', value: 'bg-red-100 text-red-700' },
];

const PERMISSION_SCHEMA = [
  { id: 'core', label: 'Ana Modüller', icon: LayoutDashboard, subModules: [{ key: 'dashboard', label: 'Genel Bakış' }, { key: 'planner', label: 'Senaryo Planlayıcı' }] },
  { id: 'planning', label: 'Planlama & Yönetim', icon: Briefcase, subModules: [{ key: 'tasks', label: 'İş Emirleri' }, { key: 'orders', label: 'Manuel Siparişler' }, { key: 'daily_reports', label: 'Günlük Raporlar' }, { key: 'shifts', label: 'Giriş/Çıkış Takibi' }, { key: 'leaves', label: 'İzin Sistemi' }] },
  { id: 'commission', label: 'Prim Sistemi', icon: Percent, subModules: [{ key: 'social', label: 'Sosyal Medya Primi' }, { key: 'retail', label: 'Mağaza Satış Primi' }, { key: 'operation', label: 'Operasyon Primi' }] },
  { id: 'reports', label: 'Raporlar ve Analiz', icon: BarChart3, subModules: [{ key: 'reports', label: 'Tüm Raporlar' }] },
  { id: 'settings', label: 'Sistem Ayarları', icon: Settings, subModules: [{ key: 'settings', label: 'Tüm Ayarlar' }] }
];

// --- HESAPLAMA YARDIMCILARI ---
const calculateTenure = (startDate) => {
  if (!startDate) return 'Bilinmiyor';
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = now - start;
  if (diffTime < 0) return 'Henüz Başlamadı';
  
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
  const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
  
  if (diffYears > 0) return `${diffYears} Yıl ${diffMonths > 0 ? diffMonths + ' Ay' : ''}`;
  if (diffMonths > 0) return `${diffMonths} Ay`;
  return 'Yeni Başladı';
};

const getTenureInMonthsForStats = (startDate) => {
  if (!startDate) return 0;
  const diffTime = new Date() - new Date(startDate);
  return diffTime > 0 ? diffTime / (1000 * 60 * 60 * 24 * 30.44) : 0;
};

const TeamManagement = () => {
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tümü');
  const [statusFilter, setStatusFilter] = useState('Aktif');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false); 
  const [modalMode, setModalMode] = useState('add'); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormData = {
    uid: '', name: '', email: '', password: '', role: 'Personel', 
    department: '', startDate: '', identityNo: '', isActive: true, 
    avatarColor: AVATAR_COLORS[0], permissions: ['dashboard']
  };
  const [formData, setFormData] = useState(initialFormData);

  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptColor, setNewDeptColor] = useState(DEPARTMENT_COLORS[0].value);

  // --- VERİ ÇEKME ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersData, deptsData] = await Promise.all([ getAllTeamMembers(), getDepartments() ]);
      const sanitizedMembers = membersData.map(m => ({...m, isActive: m.isActive !== false}));
      setMembers(sanitizedMembers);
      setDepartments(deptsData || []);
    } catch (error) {
      console.error("Veri hatası:", error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter, statusFilter]);

  // --- İSTATİSTİKLER (KPI) ---
  const stats = useMemo(() => {
    const total = members.length;
    const activeCount = members.filter(m => m.isActive).length;
    
    const membersWithStartDate = members.filter(m => m.startDate && m.isActive);
    const totalMonths = membersWithStartDate.reduce((acc, m) => acc + getTenureInMonthsForStats(m.startDate), 0);
    const avgMonths = membersWithStartDate.length > 0 ? totalMonths / membersWithStartDate.length : 0;
    
    let avgTenureText = 'Veri Yok';
    if (avgMonths > 0) {
        const y = Math.floor(avgMonths / 12);
        const m = Math.floor(avgMonths % 12);
        avgTenureText = y > 0 ? `${y} Yıl ${m} Ay` : `${m} Ay`;
    }

    return { total, activeCount, depts: departments.length, avgTenureText };
  }, [members, departments]);

  // --- FİLTRELEME & SAYFALAMA ---
  const filteredUsers = useMemo(() => {
    return members.filter(user => {
      const matchesSearch = (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'Tümü' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'Tümü' || (statusFilter === 'Aktif' ? user.isActive : !user.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchTerm, roleFilter, statusFilter]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // --- İŞLEMLER ---
  const handleExport = () => {
    let csv = "data:text/csv;charset=utf-8,Ad Soyad,E-Posta,Rol,Departman,Ise Baslama,Durum\n";
    filteredUsers.forEach(u => {
      const deptName = departments.find(d => d.id === u.department)?.label || 'Atanmamis';
      csv += `"${u.name}","${u.email}",${u.role},${deptName},${u.startDate || 'Bilinmiyor'},${u.isActive ? 'Aktif' : 'Pasif'}\n`;
    });
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `Personel_Listesi_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const handleDeleteUser = async (targetUid) => {
    if (!targetUid) return alert("Hata: Kullanıcı ID bulunamadı.");
    if(window.confirm("Bu personeli tamamen silmek yerine 'Pasif' duruma almanız önerilir (Geçmiş verileri korumak için). Yine de SİLMEK istediğinize emin misiniz?")) {
      try {
          await deleteTeamMember(targetUid);
          setMembers(prev => prev.filter(m => m.uid !== targetUid));
      } catch (error) { alert("Silme başarısız: " + error.message); }
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (modalMode === 'add' && !formData.password) return alert("Şifre zorunludur.");
    if (!formData.name || !formData.email) return alert("Ad ve E-posta zorunludur.");

    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        await addTeamMember(formData);
      } else {
        if (!formData.uid) throw new Error("ID bulunamadı.");
        const { password: _password, ...updateData } = formData; 
        await updateTeamMember(formData.uid, updateData);
      }
      setIsUserModalOpen(false);
      fetchData(); 
    } catch (error) { alert("Hata: " + error.message); }
    setIsSubmitting(false);
  };

  const togglePermission = (key) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key) ? prev.permissions.filter(p => p !== key) : [...prev.permissions, key]
    }));
  };

  const toggleCategory = (category) => {
    setFormData(prev => {
        const allKeys = category.subModules.map(m => m.key);
        const allActive = allKeys.every(k => prev.permissions.includes(k));
        const newPerms = allActive ? prev.permissions.filter(p => !allKeys.includes(p)) : [...new Set([...prev.permissions, ...allKeys])];
        return { ...prev, permissions: newPerms };
    });
  };

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) return;
    const id = newDeptName.toLowerCase().replace(/ /g, '_').replace(/[^\w-]+/g, ''); 
    const newDept = { id, label: newDeptName, color: newDeptColor };
    const updatedDepts = [...departments, newDept];
    setDepartments(updatedDepts);
    await saveDepartments(updatedDepts);
    setNewDeptName('');
  };

  const handleDeleteDepartment = async (id) => {
    if (window.confirm("Bu departmanı silmek istiyor musunuz?")) {
      const updatedDepts = departments.filter(d => d.id !== id);
      setDepartments(updatedDepts);
      await saveDepartments(updatedDepts);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ 
        ...initialFormData,
        department: departments[0]?.id || '', 
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    });
    setIsUserModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setFormData({
        uid: user.uid, 
        name: user.name || '', email: user.email || '', password: '', 
        role: user.role || 'Personel', department: user.department || '',
        startDate: user.startDate || '', identityNo: user.identityNo || '', 
        isActive: user.isActive !== false,
        avatarColor: user.avatarColor || AVATAR_COLORS[0], permissions: user.permissions || []
    });
    setIsUserModalOpen(true);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* HEADER & KPI KARTLARI */}
      <div className="mb-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">İnsan Kaynakları & Ekip</h3>
            <p className="text-sm text-slate-500 mt-1">Personel veritabanı, yetkilendirme ve departman organizasyonu.</p>
          </div>
          
          {/* BUTON GRUBU - SCROLLBAR KALDIRILDI, FLEX-WRAP EKLENDİ */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
             <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm">
                <Download size={16}/> <span className="hidden sm:inline">Excel</span>
             </button>
             <button onClick={() => setIsDeptModalOpen(true)} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm">
                <Briefcase size={16}/> Departmanlar
             </button>
             <button onClick={openAddModal} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg">
                <UserPlus size={16}/> Yeni Personel
             </button>
          </div>
        </div>

        {/* KPI KARTLARI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Users size={24}/></div>
               <div><p className="text-[10px] font-bold text-slate-400 uppercase">Toplam Kayıt</p><h4 className="text-2xl font-black text-slate-800">{stats.total}</h4></div>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600"><UserCheck size={24}/></div>
               <div><p className="text-[10px] font-bold text-slate-400 uppercase">Aktif Çalışan</p><h4 className="text-2xl font-black text-slate-800">{stats.activeCount}</h4></div>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><LayoutDashboard size={24}/></div>
               <div><p className="text-[10px] font-bold text-slate-400 uppercase">Departman</p><h4 className="text-2xl font-black text-slate-800">{stats.depts}</h4></div>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600"><CalendarDays size={24}/></div>
               <div><p className="text-[10px] font-bold text-slate-400 uppercase">Ortalama Kıdem</p><h4 className="text-lg font-black text-slate-800 leading-tight">{stats.avgTenureText}</h4></div>
           </div>
        </div>
      </div>

      {/* FİLTRELER */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 mb-6">
         <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-2.5 text-slate-400"/>
            <input 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-blue-500 transition" 
              placeholder="İsim veya e-posta ile ara..."
            />
         </div>
         <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none cursor-pointer">
            <option value="Tümü">Tüm Roller</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
         </select>
         <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none cursor-pointer">
            <option value="Tümü">Tüm Durumlar</option>
            <option value="Aktif">Sadece Aktifler</option>
            <option value="Pasif">Sadece Pasifler (Ayrılanlar)</option>
         </select>
      </div>

      {/* PROFESYONEL VERİ TABLOSU */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {loading ? (
            <div className="text-center py-20 text-slate-400 flex flex-col items-center"><Loader2 className="animate-spin mb-2"/> Veriler Yükleniyor...</div>
        ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                     <tr>
                        <th className="px-5 py-4">Personel & İletişim</th>
                        <th className="px-5 py-4">Departman & Rol</th>
                        <th className="px-5 py-4">İşe Başlama & Kıdem</th>
                        <th className="px-5 py-4 text-center">Durum</th>
                        <th className="px-5 py-4 text-right">İşlem</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {currentItems.length > 0 ? currentItems.map(user => {
                        const dept = departments.find(d => d.id === user.department);
                        const isProfileIncomplete = !user.identityNo || !user.startDate || !user.department;

                        return (
                           <tr key={user.uid} className={`hover:bg-slate-50 transition-colors ${!user.isActive ? 'opacity-60 bg-slate-50/50' : ''}`}>
                              <td className="px-5 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border border-white ${user.avatarColor || 'bg-slate-200 text-slate-600'}`}>
                                       {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                       <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                          {user.name} 
                                          {isProfileIncomplete && user.isActive && <AlertTriangle size={14} className="text-orange-400" title="Profil Bilgileri Eksik"/>}
                                       </div>
                                       <div className="text-[11px] text-slate-500 mt-0.5">{user.email}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-5 py-4">
                                 <div className="flex flex-col gap-1.5 items-start">
                                    {dept ? (
                                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${dept.color}`}>
                                          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></div> {dept.label}
                                       </span>
                                    ) : <span className="text-[10px] text-slate-400 italic bg-slate-100 px-2 py-0.5 rounded">Atanmamış</span>}
                                    <span className="text-xs font-medium text-slate-600 border border-slate-200 px-2 py-0.5 rounded bg-white">{user.role}</span>
                                 </div>
                              </td>
                              <td className="px-5 py-4">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700">{user.startDate ? new Date(user.startDate).toLocaleDateString('tr-TR') : '-'}</span>
                                    <span className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Clock size={10}/> {calculateTenure(user.startDate)}</span>
                                 </div>
                              </td>
                              <td className="px-5 py-4 text-center">
                                 <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                                    {user.isActive ? 'Aktif' : 'Pasif'}
                                 </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => openEditModal(user)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-100" title="Düzenle">
                                       <Edit2 size={16}/>
                                    </button>
                                    <button onClick={() => handleDeleteUser(user.uid)} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition border border-transparent hover:border-red-100" title="Sil">
                                       <Trash2 size={16}/>
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        );
                     }) : (
                        <tr><td colSpan="5" className="p-10 text-center text-slate-400">Kriterlere uygun personel bulunamadı.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
        )}
        
        {/* SAYFALAMA */}
        {filteredUsers.length > itemsPerPage && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-sm">
               <span className="text-slate-500 font-medium">Toplam <span className="font-bold text-slate-800">{filteredUsers.length}</span> personelden <span className="font-bold text-slate-800">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)}</span> arası</span>
               <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition shadow-sm"><ChevronLeft size={16}/></button>
                  <span className="font-bold text-slate-700 px-2">{currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition shadow-sm"><ChevronRight size={16}/></button>
               </div>
            </div>
        )}
      </div>

      {/* --- KULLANICI MODALI --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        {modalMode === 'add' ? <UserPlus size={20}/> : <Edit2 size={20}/>}
                        {modalMode === 'add' ? 'Yeni Personel Ekle' : 'Personel Düzenle'}
                    </h3>
                    <button onClick={() => setIsUserModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                </div>

                <form onSubmit={handleUserSubmit} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row">
                    {/* SOL PANEL: KİŞİSEL BİLGİLER */}
                    <div className="p-6 lg:w-1/3 border-r border-slate-100 space-y-5 bg-white">
                        
                        {/* AKTİF / PASİF DURUMU */}
                        {modalMode === 'edit' && (
                           <div className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer select-none transition-colors ${formData.isActive ? 'bg-green-50 border-green-200 text-green-800' : 'bg-slate-100 border-slate-200 text-slate-600'}`} onClick={() => setFormData({...formData, isActive: !formData.isActive})}>
                              <div className="flex items-center gap-2 font-bold text-sm">
                                 {formData.isActive ? <UserCheck size={16}/> : <UserMinus size={16}/>}
                                 {formData.isActive ? 'Aktif Çalışan' : 'Pasif (Ayrılmış)'}
                              </div>
                              <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                                 <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.isActive ? 'left-[22px]' : 'left-[2px]'}`}></div>
                              </div>
                           </div>
                        )}

                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${formData.avatarColor}`}>
                                {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ad Soyad *</label>
                                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-transparent border-b border-slate-300 font-bold text-slate-800 outline-none focus:border-blue-500 py-1" placeholder="İsim Giriniz"/>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">E-Posta *</label>
                            <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"/>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">
                                {modalMode === 'add' ? 'Şifre (Zorunlu) *' : 'Yeni Şifre (İsteğe Bağlı)'}
                            </label>
                            <input 
                                type="password" 
                                required={modalMode === 'add'} 
                                value={formData.password} 
                                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                                placeholder={modalMode === 'edit' ? 'Değiştirmeyecekseniz boş bırakın' : ''}
                            />
                        </div>

                        <div className="border-t border-slate-100 pt-4 mt-2">
                           <div className="grid grid-cols-2 gap-3 mb-4">
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1"><CalendarDays size={12}/> Başlama Tarihi *</label>
                                  <input required type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-blue-500 bg-slate-50"/>
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1"><IdCard size={12}/> Sicil/TC No</label>
                                  <input type="text" value={formData.identityNo} onChange={(e) => setFormData({...formData, identityNo: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-blue-500 bg-slate-50" placeholder="Opsiyonel"/>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-3">
                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Rol</label>
                                   <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium outline-none bg-white">
                                       {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                   </select>
                               </div>
                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Departman</label>
                                   <select required value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium outline-none bg-white">
                                       <option value="">Seçiniz *</option>
                                       {departments.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                                   </select>
                               </div>
                           </div>
                        </div>
                    </div>

                    {/* SAĞ PANEL: YETKİLER */}
                    <div className="p-6 lg:w-2/3 bg-slate-50/50">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2"><Lock size={16}/> Erişim Yetkileri</h4>
                            <span className="text-xs text-slate-400">* Admin rolü tüm yetkilere sahiptir.</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {PERMISSION_SCHEMA.map((category) => {
                                const allActive = category.subModules.every(sub => formData.permissions.includes(sub.key));
                                const Icon = category.icon;
                                
                                return (
                                    <div key={category.id} className={`bg-white border rounded-xl p-4 transition-all ${allActive ? 'border-slate-800 shadow-sm' : 'border-slate-200'}`}>
                                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <Icon size={16} className="text-slate-600"/>
                                                <span className="text-sm font-bold text-slate-700">{category.label}</span>
                                            </div>
                                            <button type="button" onClick={() => toggleCategory(category)} className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${allActive ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                                {allActive ? 'Kapat' : 'Tümü'}
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {category.subModules.map(sub => (
                                                <label key={sub.key} className="flex items-center justify-between cursor-pointer group select-none">
                                                    <span className={`text-xs font-medium transition ${formData.permissions.includes(sub.key) ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>{sub.label}</span>
                                                    <div className="relative">
                                                        <input type="checkbox" className="sr-only peer" checked={formData.permissions.includes(sub.key)} onChange={() => togglePermission(sub.key)}/>
                                                        <div className={`w-9 h-5 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${formData.permissions.includes(sub.key) ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </form>

                <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3">
                    <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Vazgeç</button>
                    <button onClick={handleUserSubmit} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 flex items-center gap-2 disabled:opacity-70">
                        {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Kaydet
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- DEPARTMAN MODALI --- */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Departman Yönetimi</h3>
                    <button onClick={() => setIsDeptModalOpen(false)}><X size={20} className="text-slate-400"/></button>
                </div>
                <div className="p-6">
                    <div className="flex gap-2 mb-6">
                        <input value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-800" placeholder="Yeni Departman Adı"/>
                        <select value={newDeptColor} onChange={(e) => setNewDeptColor(e.target.value)} className="w-24 px-2 border border-slate-200 rounded-xl text-xs">
                            {DEPARTMENT_COLORS.map(c => <option key={c.label} value={c.value}>{c.label}</option>)}
                        </select>
                        <button onClick={handleAddDepartment} className="bg-slate-900 text-white p-2 rounded-xl"><Plus size={20}/></button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {departments.map(dept => (
                            <div key={dept.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${dept.color}`}>{dept.label}</span>
                                <button onClick={() => handleDeleteDepartment(dept.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        ))}
                        {departments.length === 0 && <p className="text-center text-xs text-slate-400">Henüz departman yok.</p>}
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default TeamManagement;
