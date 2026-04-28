import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Calendar, CheckCircle, Search, Trash2, Edit,
  Briefcase, Filter, X, Lock, Download, Loader2, 
  ClipboardList, ChevronDown, ChevronRight, ArrowUpDown, RefreshCw,
  List, AlertCircle // Eksik olan ikonlar eklendi
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { subscribeToReports, addReport, updateReport, deleteReport } from '../../firebase/reportService';
import { subscribeToTasks } from '../../firebase/taskService';
import { getDepartments } from '../../firebase/teamService'; 
import {
  getLockedEditToastMessage,
  getReportEditState,
  getReportEditTooltip
} from '../../utils/reportEditUtils';

const WorkReport = () => {
  const { userData } = useAuth();
  const isManager = ['Admin', 'Manager', 'CEO', 'Director'].includes(userData?.role);

  // --- STATE ---
  const [dailyReports, setDailyReports] = useState([]);
  const [systemTasks, setSystemTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FİLTRE STATE ---
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]); 
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDept, setSelectedDept] = useState('Tümü');
  const [statusFilter, setStatusFilter] = useState('Tümü'); // YENİ: Durum Filtresi
  const [searchText, setSearchText] = useState('');

  // --- SIRALAMA STATE ---
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // --- UI STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  
  // --- FORM STATE ---
  const [editingReportId, setEditingReportId] = useState(null); 
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [tempTasks, setTempTasks] = useState([]);
  const initialTaskState = { title: '', category: '', status: 'Tamamlandı', detail: '', note: '' };
  const [currentTask, setCurrentTask] = useState(initialTaskState);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const isEditingTask = editingTaskIndex !== null;

  // --- VERİ ÇEKME ---
  useEffect(() => {
    const fetchData = async () => {
        try {
            const depts = await getDepartments();
            setDepartments(depts || []);
        } catch(e) { console.error(e); }
        
        const unsub1 = subscribeToReports(
          setDailyReports,
          { uid: userData?.uid, isManagement: isManager }
        );
        const unsub2 = subscribeToTasks(
          (data) => {
            setSystemTasks(data);
            setLoading(false);
          },
          { uid: userData?.uid, isManagement: isManager }
        );
        return () => { unsub1(); unsub2(); };
    };
    fetchData();
  }, [userData, isManager]);

  // --- VERİ BİRLEŞTİRME & İŞLEME ---
  const processedReports = useMemo(() => {
    if (!dailyReports) return [];
    let combined = JSON.parse(JSON.stringify(dailyReports));

    // Sistem görevlerini birleştir
    if (systemTasks && systemTasks.length > 0) {
        systemTasks.forEach(task => {
            if (!task.assignee || !task.dueDate) return;
            const existingIndex = combined.findIndex(r => r.date === task.dueDate && r.userId === task.assignee);
            
            const taskItem = {
                id: task.id,
                title: task.title,
                category: task.department || 'İş Emri', // Görevin departmanını al
                status: task.status,
                detail: task.detail || 'Sistem tarafından oluşturuldu.',
                note: `Öncelik: ${task.priority}`,
                isSystemTask: true
            };

            if (existingIndex > -1) {
                if(!combined[existingIndex].tasks.some(t => t.id === task.id)) {
                    combined[existingIndex].tasks.push(taskItem);
                }
            } else {
                combined.push({
                    id: `virtual-${task.id}`,
                    date: task.dueDate,
                    user: task.assigneeName || 'Personel',
                    userId: task.assignee,
                    role: 'Sistem',
                    createdAt: new Date(task.dueDate).getTime(),
                    tasks: [taskItem],
                    isVirtual: true
                });
            }
        });
    }

    // 1. FİLTRELEME
    let filtered = combined.filter(r => {
        // Yetki Kontrolü
        if (!isManager && r.userId !== userData?.uid) return false;

        // Tarih Aralığı (Boşsa kontrol etme)
        if (startDate && r.date < startDate) return false;
        if (endDate && r.date > endDate) return false;

        // Departman Kontrolü (DÜZELTİLDİ: Raporun içindeki taskların kategorisine bakar)
        if (selectedDept !== 'Tümü') {
            const hasMatchingTask = r.tasks && r.tasks.some(t => t.category === selectedDept);
            const isRoleMatch = r.role === selectedDept;
            if (!hasMatchingTask && !isRoleMatch) return false;
        }

        // Durum Kontrolü (YENİ EKLENDİ)
        if (statusFilter === 'Sürüyor') {
            const hasPending = r.tasks && r.tasks.some(t => t.status !== 'Tamamlandı');
            if (!hasPending) return false;
        } else if (statusFilter === 'Tamamlandı') {
            const isAllCompleted = r.tasks && r.tasks.length > 0 && r.tasks.every(t => t.status === 'Tamamlandı');
            if (!isAllCompleted) return false;
        }

        // Arama (İsim veya Başlık)
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            const matchUser = r.user.toLowerCase().includes(searchLower);
            const matchTask = r.tasks && r.tasks.some(t => t.title.toLowerCase().includes(searchLower));
            if (!matchUser && !matchTask) return false;
        }

        return true;
    });

    // 2. SIRALAMA
    return filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [dailyReports, systemTasks, startDate, endDate, selectedDept, statusFilter, searchText, sortConfig, isManager, userData]);

  // --- SIRALAMA & SIFIRLAMA FONKSİYONLARI ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleResetFilters = () => {
    setStartDate(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setSelectedDept('Tümü');
    setStatusFilter('Tümü');
    setSearchText('');
  };

  // --- İSTATİSTİKLER ---
  const stats = useMemo(() => {
    let total = 0, completed = 0;
    processedReports.forEach(r => {
        if(r.tasks) {
            r.tasks.forEach(t => {
                total++;
                if(t.status === 'Tamamlandı') completed++;
            });
        }
    });
    return { total, completed, rate: total > 0 ? Math.round((completed/total)*100) : 0 };
  }, [processedReports]);

  const reportEditStateMap = useMemo(() => {
    const next = new Map();
    processedReports.forEach((report) => {
      next.set(report.id, getReportEditState(report));
    });
    return next;
  }, [processedReports]);

  // --- YARDIMCI FONKSİYONLAR ---
  const showToast = (message, type = 'default') => {
    const id = `report-toast-${toastIdRef.current}`;
    toastIdRef.current += 1;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const canEditReport = (report) => {
    const editState = reportEditStateMap.get(report.id) || getReportEditState(report);
    if (editState.editable) return true;
    showToast(getLockedEditToastMessage(editState), 'error');
    return false;
  };

  // --- CRUD İŞLEMLERİ ---
  const openNewModal = () => {
    setEditingReportId(null);
    setTempTasks([]);
    setReportDate(new Date().toISOString().split('T')[0]);
    setCurrentTask(initialTaskState);
    setEditingTaskIndex(null);
    setEditingTaskId(null);
    setIsModalOpen(true);
  };

  const normalizeTaskForEdit = (task, fallbackIndex = 0) => ({
    ...initialTaskState,
    ...task,
    id: task?.id || `task-${Date.now()}-${fallbackIndex}`
  });

  const resetTaskEditor = () => {
    setCurrentTask(initialTaskState);
    setEditingTaskIndex(null);
    setEditingTaskId(null);
  };

  const closeModal = () => {
    resetTaskEditor();
    setIsModalOpen(false);
  };

  const openEditModal = (report) => {
    if (!canEditReport(report)) return;
    setEditingReportId(report.id);
    setReportDate(report.date);
    setTempTasks(
      (report.tasks || [])
        .filter(t => !t.isSystemTask)
        .map((task, index) => normalizeTaskForEdit(task, index))
    ); // Sistem işleri formda gizlenir
    resetTaskEditor();
    setIsModalOpen(true);
  };

  const handleEditTask = (task, index) => {
    setCurrentTask(normalizeTaskForEdit(task, index));
    setEditingTaskIndex(index);
    setEditingTaskId(task.id || null);
  };

  const handleTaskAdd = () => {
    if(!currentTask.title) return alert("Lütfen bir görev başlığı girin.");
    if(!currentTask.category) return alert("Lütfen bir departman seçiniz.");
    
    const newTask = normalizeTaskForEdit(currentTask, tempTasks.length);
    if(editingTaskIndex !== null) {
        const updated = [...tempTasks];
        updated[editingTaskIndex] = newTask;
        setTempTasks(updated);
    } else {
        setTempTasks([...tempTasks, newTask]);
    }
    resetTaskEditor();
  };

  const handleTaskRemove = (taskId, index) => {
    setTempTasks(prev => prev.filter((task, i) => (task.id || `idx-${i}`) !== (taskId || `idx-${index}`)));
    if (editingTaskId === taskId || editingTaskIndex === index) {
      resetTaskEditor();
      return;
    }
    if (editingTaskIndex !== null && index < editingTaskIndex) {
      setEditingTaskIndex(prev => (prev !== null ? prev - 1 : prev));
    }
  };

  const handleSave = async () => {
    if(tempTasks.length === 0) return alert("Raporu kaydetmek için en az 1 görev eklemelisiniz.");
    try {
        const payload = { date: reportDate, tasks: tempTasks };
        if(editingReportId) {
            await updateReport(editingReportId, payload);
        } else {
            await addReport({ ...payload, user: userData.name, userId: userData.uid, role: userData.department || userData.role || 'Personel' });
        }
        closeModal();
    } catch(e) { alert("Hata oluştu: " + e.message); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Bu raporu tamamen silmek istediğinize emin misiniz?")) await deleteReport(id);
  };

  const handleExport = () => {
    let csv = "data:text/csv;charset=utf-8,Tarih,Personel,Departman,Gorev,Durum,Detay\n";
    processedReports.forEach(r => {
        if(r.tasks) {
            r.tasks.forEach(t => {
                csv += `${r.date},${r.user},${t.category},"${t.title.replace(/"/g, '""')}",${t.status},"${t.detail.replace(/"/g, '""')}"\n`;
            });
        }
    });
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `Raporlar_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  if (loading) return <div className="flex h-96 items-center justify-center text-slate-400"><Loader2 className="animate-spin mr-2"/> Raporlar Yükleniyor...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. ÜST FİLTRE & ARAÇ ÇUBUĞU */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
         
         {/* FİLTRELER */}
         <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            
            {/* TARİH */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <Calendar size={16} className="text-slate-400"/>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-transparent text-sm font-medium outline-none w-28 text-slate-600"/>
                <span className="text-slate-300">-</span>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-transparent text-sm font-medium outline-none w-28 text-slate-600"/>
            </div>

            {/* DEPARTMAN */}
            <div className="relative">
                <select 
                    value={selectedDept} 
                    onChange={e=>setSelectedDept(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 pl-3 pr-8 py-2 rounded-lg text-sm font-medium text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition"
                >
                    <option value="Tümü">Tüm Departmanlar</option>
                    {departments.map(d => <option key={d.id} value={d.label}>{d.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
            </div>

            {/* DURUM (YENİ) */}
            <div className="relative">
                <select 
                    value={statusFilter} 
                    onChange={e=>setStatusFilter(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 pl-3 pr-8 py-2 rounded-lg text-sm font-medium text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition"
                >
                    <option value="Tümü">Tüm Durumlar</option>
                    <option value="Sürüyor">Süren İşler</option>
                    <option value="Tamamlandı">Tamamlananlar</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
            </div>

            {/* ARAMA */}
            <div className="relative flex-1 xl:w-56">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400"/>
                <input 
                    placeholder="Personel veya görev..." 
                    value={searchText} 
                    onChange={e=>setSearchText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-lg text-sm outline-none focus:bg-white focus:border-blue-400 transition"
                />
            </div>

            {/* SIFIRLA */}
            <button onClick={handleResetFilters} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Filtreleri Temizle">
                <RefreshCw size={16}/>
            </button>
         </div>

         {/* AKSİYONLAR & KPI ÖZETİ */}
         <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-end">
            <div className="flex gap-4 text-xs font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                <span>Rapor: <span className="text-slate-800">{processedReports.length}</span></span>
                <span>Görev: <span className="text-slate-800">{stats.total}</span></span>
                <span>Biten: <span className="text-green-600">{stats.completed}</span></span>
            </div>
            
            <div className="flex gap-2">
                <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition flex items-center gap-2">
                    <Download size={16}/> <span className="hidden md:inline">Excel</span>
                </button>
                <button onClick={openNewModal} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition flex items-center gap-2 shadow-lg">
                    <Plus size={16}/> <span className="hidden md:inline">Yeni Rapor</span>
                </button>
            </div>
         </div>
      </div>

      {/* 2. VERİ TABLOSU */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 w-10"></th>
                        <th onClick={()=>handleSort('date')} className="px-6 py-4 font-bold text-slate-600 cursor-pointer hover:text-blue-600 transition select-none group">
                            <div className="flex items-center gap-1">Tarih <ArrowUpDown size={14} className="opacity-50 group-hover:opacity-100"/></div>
                        </th>
                        <th onClick={()=>handleSort('user')} className="px-6 py-4 font-bold text-slate-600 cursor-pointer hover:text-blue-600 transition select-none group">
                            <div className="flex items-center gap-1">Personel <ArrowUpDown size={14} className="opacity-50 group-hover:opacity-100"/></div>
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-600">Departman</th>
                        <th className="px-6 py-4 font-bold text-slate-600">İlerleme</th>
                        <th className="px-6 py-4 font-bold text-slate-600 text-right">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {processedReports.length > 0 ? processedReports.map((report) => {
                        const isExpanded = expandedRow === report.id;
                        const editState = reportEditStateMap.get(report.id) || getReportEditState(report);
                        const editable = editState.editable;
                        const totalTasks = report.tasks ? report.tasks.length : 0;
                        const completedTasks = report.tasks ? report.tasks.filter(t => t.status === 'Tamamlandı').length : 0;
                        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                        
                        // Satırdaki genel departmanı bulmak için
                        const mainDept = report.role !== 'Sistem' ? report.role : (report.tasks[0]?.category || 'Genel');

                        return (
                            <React.Fragment key={report.id}>
                                {/* ANA SATIR */}
                                <tr 
                                    className={`hover:bg-slate-50 transition cursor-pointer ${isExpanded ? 'bg-blue-50/30' : ''} ${editState.lockType === 'completed_locked' || editState.lockType === 'missing_completedAt' ? 'opacity-80' : ''}`}
                                    onClick={() => setExpandedRow(isExpanded ? null : report.id)}
                                >
                                    <td className="px-6 py-4 text-center">
                                        {isExpanded ? <ChevronDown size={16} className="text-blue-600"/> : <ChevronRight size={16} className="text-slate-400"/>}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">
                                        {new Date(report.date).toLocaleDateString('tr-TR', {day:'numeric', month:'long', year:'numeric'})}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 uppercase">
                                                {report.user.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-800">{report.user}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${report.isVirtual ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {mainDept}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 min-w-[200px]">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                                    style={{width: `${progress}%`}}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 w-12 text-right">
                                                {completedTasks}/{totalTasks}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex gap-2 flex-wrap">
                                          {editState.lockType === 'completed_within_24h' && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                                              Düzenleme süresi açık ({editState.remainingHours}s)
                                            </span>
                                          )}
                                          {(editState.lockType === 'completed_locked' || editState.lockType === 'missing_completedAt') && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                              Düzenleme kilitli
                                            </span>
                                          )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2" onClick={e=>e.stopPropagation()}>
                                            <button
                                              onClick={()=>openEditModal(report)}
                                              className={`p-2 rounded-lg transition ${editable ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50' : 'text-slate-300 bg-slate-100 cursor-not-allowed'}`}
                                              title={getReportEditTooltip(editState)}
                                              disabled={!editable}
                                            >
                                              <Edit size={16}/>
                                            </button>
                                            <button onClick={()=>handleDelete(report.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Sil"><Trash2 size={16}/></button>
                                            {!editable && (
                                              <span className="text-xs font-bold text-slate-400 flex items-center justify-end gap-1 bg-slate-100 px-2 py-1 rounded-lg inline-flex" title={getReportEditTooltip(editState)}>
                                                  <Lock size={12}/> Kilitli
                                              </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>

                                {/* DETAY SATIRI (AÇILIR KAPANIR) */}
                                {isExpanded && (
                                    <tr>
                                        <td colSpan="6" className="p-0 border-t border-b border-slate-200 bg-slate-50/50">
                                            <div className="p-6 md:pl-20 border-l-4 border-blue-500">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                                    <List size={14}/> Görev Detayları
                                                </h4>
                                                <div className="mb-3 flex justify-end">
                                                  <button
                                                    onClick={() => openEditModal(report)}
                                                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${editable ? 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100' : 'border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed'}`}
                                                    title={getReportEditTooltip(editState)}
                                                    disabled={!editable}
                                                  >
                                                    Raporu Düzenle
                                                  </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {report.tasks && report.tasks.length === 0 ? (
                                                        <span className="text-sm text-slate-400 italic">Kayıt yok.</span>
                                                    ) : (
                                                        report.tasks.map((task, idx) => (
                                                            <div key={idx} className={`bg-white p-4 rounded-xl border shadow-sm flex items-start gap-4 ${task.isSystemTask ? 'border-purple-100' : 'border-slate-200'}`}>
                                                                <div className={`mt-1.5 w-3 h-3 rounded-full flex-shrink-0 ${task.status === 'Tamamlandı' ? 'bg-green-500' : task.status === 'Sürüyor' ? 'bg-blue-500' : 'bg-orange-400'}`}></div>
                                                                <div className="flex-1">
                                                                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                                                                        <div>
                                                                            <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                                                {task.title}
                                                                                {task.isSystemTask && <span className="bg-purple-100 text-purple-600 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><ClipboardList size={10}/> OTOMATİK İŞ EMRİ</span>}
                                                                            </h5>
                                                                            <p className="text-sm text-slate-600 mt-1">{task.detail}</p>
                                                                        </div>
                                                                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase self-start ${task.status==='Tamamlandı'?'bg-green-50 text-green-600': task.status==='Sürüyor'?'bg-blue-50 text-blue-600':'bg-orange-50 text-orange-600'}`}>{task.status}</span>
                                                                    </div>
                                                                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400 font-medium">
                                                                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">{task.category}</span>
                                                                        {task.note && <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded flex items-center gap-1"><AlertCircle size={12}/> {task.note}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    }) : (
                        <tr>
                            <td colSpan="6" className="p-12 text-center text-slate-400">
                                <div className="flex flex-col items-center">
                                    <Filter size={32} className="mb-2 opacity-20"/>
                                    <p className="mt-2 font-medium text-slate-600">Kriterlere uygun rapor bulunamadı.</p>
                                    <button onClick={handleResetFilters} className="text-blue-600 text-sm font-bold mt-2 hover:underline">Filtreleri Temizle</button>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
         </div>
      </div>

      {/* --- MODAL (STANDART FORMU KORUDUK) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex overflow-hidden shadow-2xl">
                {/* SOL: FORM */}
                <div className="w-1/2 bg-slate-50 p-6 border-r border-slate-200 flex flex-col overflow-y-auto">
                    <div className="mb-6 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Briefcase size={20}/> {editingReportId ? 'Raporu Düzenle' : 'Yeni Rapor Gir'}</h3>
                        <input type="date" className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-sm font-bold text-slate-600 outline-none focus:border-blue-500 transition" value={reportDate} onChange={(e) => setReportDate(e.target.value)}/>
                    </div>
                    
                    <div className="space-y-4 flex-1">
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-1 block">GÖREV BAŞLIĞI</label>
                            <input className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 transition" placeholder="Örn: Hafta sonu sayımı" value={currentTask.title} onChange={e => setCurrentTask({...currentTask, title: e.target.value})}/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block">DEPARTMAN</label>
                                <select className="w-full border border-slate-300 p-2.5 rounded-lg text-sm bg-white outline-none focus:border-blue-500 transition" value={currentTask.category} onChange={e => setCurrentTask({...currentTask, category: e.target.value})}>
                                    <option value="">Seçiniz...</option>
                                    {departments.map((d,i) => <option key={i} value={d.label}>{d.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block">DURUM</label>
                                <select className="w-full border border-slate-300 p-2.5 rounded-lg text-sm bg-white outline-none focus:border-blue-500 transition" value={currentTask.status} onChange={e => setCurrentTask({...currentTask, status: e.target.value})}>
                                    <option value="Tamamlandı">Tamamlandı</option>
                                    <option value="Sürüyor">Sürüyor</option>
                                    <option value="Bekliyor">Bekliyor</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-1 block">DETAY (İSTEĞE BAĞLI)</label>
                            <textarea rows="3" className="w-full border border-slate-300 p-2.5 rounded-lg text-sm resize-none outline-none focus:border-blue-500 transition" placeholder="Yapılan işlemler hakkında kısa not..." value={currentTask.detail} onChange={e => setCurrentTask({...currentTask, detail: e.target.value})}></textarea>
                        </div>
                    </div>
                    {isEditingTask && (
                      <div className="mb-3 flex items-center justify-between text-xs bg-blue-50 border border-blue-100 text-blue-700 px-3 py-2 rounded-lg">
                        <span>Seçili görev düzenleniyor.</span>
                        <button onClick={resetTaskEditor} className="font-bold hover:underline">İptal</button>
                      </div>
                    )}
                    <button onClick={handleTaskAdd} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2 mt-4 shadow-lg"><Plus size={16}/> {isEditingTask ? 'Görevi Güncelle' : 'Listeye Ekle'}</button>
                </div>
                
                {/* SAĞ: LİSTE */}
                <div className="w-1/2 bg-white flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <span className="font-bold text-slate-700 flex items-center gap-2"><List size={18}/> Eklenen Görevler <span className="bg-slate-200 text-slate-600 px-2 rounded-full text-xs">{tempTasks.length}</span></span>
                        <button onClick={closeModal} className="p-1 hover:bg-slate-200 rounded-full transition"><X size={20} className="text-slate-400 hover:text-red-500"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        {tempTasks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                                <ClipboardList size={32} className="mb-2 opacity-20"/>
                                <p>Henüz görev eklemediniz.</p>
                                <p className="text-xs mt-1">Sol taraftaki formu kullanarak eklemeye başlayın.</p>
                            </div>
                        ) : (
                            tempTasks.map((t, idx) => (
                                <div
                                  key={t.id || idx}
                                  onClick={() => handleEditTask(t, idx)}
                                  className={`p-4 border rounded-xl flex justify-between items-start group transition bg-white shadow-sm cursor-pointer ${editingTaskId === t.id || editingTaskIndex === idx ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-400'}`}
                                >
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">{t.title}</div>
                                        <div className="text-xs text-slate-500 mt-1 flex gap-2 items-center">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">{t.category}</span>
                                            <span className={t.status === 'Tamamlandı' ? 'text-green-600' : 'text-blue-600'}>{t.status}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); handleEditTask(t, idx); }} className="text-slate-300 hover:text-blue-500 p-1 bg-slate-50 rounded-lg hover:bg-blue-50 transition" title="Görevi Düzenle"><Edit size={16}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleTaskRemove(t.id, idx); }} className="text-slate-300 hover:text-red-500 p-1 bg-slate-50 rounded-lg hover:bg-red-50 transition" title="Görevi Sil"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-5 border-t border-slate-100 bg-slate-50">
                        <button onClick={handleSave} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                            <CheckCircle size={18}/> {editingReportId ? 'Güncellemeyi Kaydet' : 'Raporu Onayla ve Kaydet'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {!!toasts.length && (
        <div className="fixed bottom-5 right-5 z-[120] space-y-2 pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className={`pointer-events-auto px-4 py-2 rounded-lg shadow-xl text-sm font-bold text-white animate-in slide-in-from-right ${t.type === 'error' ? 'bg-red-500' : 'bg-slate-900'}`}>
              {t.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkReport;
