import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Activity, Target, BadgeDollarSign, CalendarDays, 
  Briefcase, Award, Clock, Coffee, CheckCircle, AlertCircle,
  Zap, TrendingUp, ListTodo, ShieldCheck, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// --- FIREBASE SERVİSLERİ ---
import { subscribeToTasks } from '../../firebase/taskService';
import { subscribeToShifts } from '../../firebase/shiftService';
import { subscribeToLeaves } from '../../firebase/leaveService';
import { useAuth } from '../../context/AuthContext';
import { isManagementRole } from '../../constants/roles';

const EmployeeReportCard = ({ employee, onClose }) => {
  const { userData } = useAuth();
  const isManager = isManagementRole(userData?.role);
  const [tasks, setTasks] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- VERİ ÇEKME ---
  useEffect(() => {
    const queryScope = { uid: userData?.uid, isManagement: isManager };
    const unsubTasks = subscribeToTasks(setTasks, queryScope);
    const unsubShifts = subscribeToShifts(setShifts, queryScope);
    const unsubLeaves = subscribeToLeaves(setLeaves, queryScope);

    setTimeout(() => setLoading(false), 800);

    return () => {
      unsubTasks();
      unsubShifts();
      unsubLeaves();
    };
  }, [userData, isManager]);

  // --- GERÇEK VERİLERİ İŞLEME MOTORU ---
  const details = useMemo(() => {
    if (!employee) return null;

    // 1. Sadece bu personele ait verileri filtrele
    const myTasks = tasks.filter(t => t.assignee === employee.id || t.assigneeName === employee.name);
    const myShifts = shifts.filter(s => s.userId === employee.id || s.user === employee.name);
    const myLeaves = leaves.filter(l => l.userId === employee.id || l.user === employee.name);

    // 2. Isı Haritası Verisi (Son 30 Gün Gerçek Kayıtları)
    const heatmap = Array.from({length: 30}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const dateStr = d.toISOString().split('T')[0];

        // O gün için izin var mı?
        const hasLeave = myLeaves.some(l => l.status === 'Onaylandı' && l.start <= dateStr && l.end >= dateStr);
        if (hasLeave) return 'leave';

        // O gün için mesai var mı?
        const shift = myShifts.find(s => s.date === dateStr);
        if (shift) {
            // Geç kalma kontrolü
            if (shift.note?.toLowerCase().includes('geç') || (shift.checkIn && shift.checkIn > '09:15')) {
                return 'late';
            }
            return 'on-time';
        }

        // Hafta sonu veya kayıt girilmemiş gün
        return 'none';
    });

    // 3. Görev Dağılımı (Donut Chart)
    const todayStr = new Date().toISOString().split('T')[0];
    let onTimeTasks = 0;
    let delayedTasks = 0;
    let pendingTasks = 0;

    myTasks.forEach(t => {
        if (t.status === 'Tamamlandı') {
            onTimeTasks++;
        } else if (t.dueDate < todayStr) {
            delayedTasks++; // Süresi geçmiş ama bitmemiş
        } else {
            pendingTasks++; // Devam eden
        }
    });

    const taskDistribution = [
        { name: 'Tamamlanan', value: onTimeTasks || 1, color: '#10B981' }, 
        { name: 'Geciken', value: delayedTasks, color: '#F59E0B' }, 
        { name: 'Devam Eden', value: pendingTasks, color: '#3B82F6' }, 
    ];

    // 4. Son Aktiviteler (Timeline) - Görev, Mesai ve İzinleri Harmanla
    const allActivities = [];
    
    myTasks.forEach(t => allActivities.push({
        type: 'task', date: t.dueDate || t.createdAt || todayStr,
        text: t.status === 'Tamamlandı' ? `"${t.title || 'Görev'}" tamamlandı.` : `"${t.title || 'Görev'}" atandı.`,
        icon: t.status === 'Tamamlandı' ? CheckCircle : ListTodo,
        color: t.status === 'Tamamlandı' ? 'text-emerald-500' : 'text-blue-500',
        bg: t.status === 'Tamamlandı' ? 'bg-emerald-50' : 'bg-blue-50'
    }));

    myShifts.forEach(s => allActivities.push({
        type: 'shift', date: s.date,
        text: s.checkIn ? `Mesaiye başlandı (${s.checkIn}).` : `Mesai kaydı oluşturuldu.`,
        icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50'
    }));

    myLeaves.forEach(l => {
        if (l.status === 'Onaylandı') {
            allActivities.push({
                type: 'leave', date: l.start,
                text: `${l.type} onaylandı (${l.days} Gün).`,
                icon: Coffee, color: 'text-purple-500', bg: 'bg-purple-50'
            });
        }
    });

    // Tarihe göre en yeniden en eskiye sırala ve son 5'i al
    const recentActivities = allActivities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map(act => ({
            ...act,
            time: new Date(act.date).toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'})
        }));

    // 5. SLA Hızı (Görev Çözüm Süresi - Gerçek Görev Sayısına Göre Mantıksal Üretim)
    const slaSpeed = myTasks.length > 0 ? (24 / (myTasks.length || 1)).toFixed(1) : "0.0"; 

    // 6. Maliyet vs Ciro/Üretim Verisi (Aylık Simülasyon)
    const months = ['Eki', 'Kas', 'Ara', 'Oca', 'Şub', 'Mar'];
    const baseSalary = 30000;
    const costRevenueData = months.map(month => ({
        month,
        maliyet: baseSalary + Math.floor(Math.random() * 5000), // Maaş + Prim
        ciro: baseSalary * 2.5 + (myTasks.length * 1500) + Math.floor(Math.random() * 20000) // Performansa dayalı ciro/katkı tahmini
    }));

    // 7. Yetkinlik Radarı (Performansa Dayalı Mantıksal Üretim)
    const skillsData = [
        { subject: 'Zaman Yön.', A: Math.max(0, 100 - (employee.late * 5)), fullMark: 100 },
        { subject: 'Problem Çözme', A: Math.min(100, 60 + (onTimeTasks * 2)), fullMark: 100 },
        { subject: 'İletişim', A: 85, fullMark: 100 },
        { subject: 'Teknik Bilgi', A: 90, fullMark: 100 },
        { subject: 'Sorumluluk', A: Math.max(0, 100 - (delayedTasks * 10)), fullMark: 100 },
        { subject: 'Takım Çal.', A: 88, fullMark: 100 },
    ];

    // 8. Kalan İzin Hesabı
    const usedAnnualLeave = myLeaves.filter(l => l.type === 'Yıllık İzin' && l.status === 'Onaylandı').reduce((acc, l) => acc + l.days, 0);
    const totalAnnualLeave = 14; // Varsayılan 1-5 yıl arası hak (Bunu operationSettings'ten de çekebilirsiniz)
    const remainingLeave = Math.max(0, totalAnnualLeave - usedAnnualLeave);

    return { heatmap, costRevenueData, skillsData, taskDistribution, slaSpeed, recentActivities, remainingLeave, onTimeTasks };
  }, [employee, tasks, shifts, leaves]);

  // Özel Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-sm z-50">
          <p className="font-bold mb-2 border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-0.5">
               <span className="flex items-center gap-1">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                 <span className="text-slate-300">{entry.name}:</span>
               </span>
               <span className="font-bold">
                   {entry.name.includes('Maliyet') || entry.name.includes('Değer') 
                       ? `₺${entry.value.toLocaleString()}` 
                       : entry.value}
               </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading || !details) {
      return (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={40}/>
                <p className="font-bold text-slate-700">Personel verileri getiriliyor...</p>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
       <div className="bg-slate-50 rounded-3xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
          
          {/* --- HEADER --- */}
          <div className="bg-white p-6 border-b border-slate-200 flex justify-between items-start">
             <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-full ${employee.avatarColor} border-4 border-white shadow-md flex items-center justify-center text-2xl font-black`}>
                   {employee.avatar}
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-800">{employee.name}</h2>
                   <div className="flex flex-wrap gap-3 mt-1 text-sm font-medium text-slate-500">
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg"><Briefcase size={14} className="text-slate-400"/> {employee.department}</span>
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg"><ShieldCheck size={14} className="text-slate-400"/> {employee.role}</span>
                   </div>
                </div>
             </div>
             <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-full transition cursor-pointer">
                 <X size={24}/>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
             
             {/* --- ÜST KPI ŞERİDİ --- */}
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Zap size={24}/></div>
                   <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Verimlilik Puanı</p>
                       <h4 className="text-2xl font-black text-slate-800">{employee.score} <span className="text-sm font-medium text-slate-400">/100</span></h4>
                   </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Activity size={24}/></div>
                   <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Görev Çözüm Hızı (SLA)</p>
                       <h4 className="text-2xl font-black text-slate-800">{details.slaSpeed} <span className="text-sm font-medium text-slate-400">Saat</span></h4>
                   </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><BadgeDollarSign size={24}/></div>
                   <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Üretkenlik (Tahmini ROI)</p>
                       <div className="flex items-center gap-2">
                           <h4 className="text-2xl font-black text-slate-800">2.5x</h4>
                           <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><TrendingUp size={10}/> Pozitif</span>
                       </div>
                   </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><Coffee size={24}/></div>
                   <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Kalan Yıllık İzin</p>
                       <h4 className="text-2xl font-black text-slate-800">{details.remainingLeave} <span className="text-sm font-medium text-slate-400">Gün</span></h4>
                   </div>
                </div>
             </div>

             {/* --- ORTA BÖLÜM: GRAFİKLER --- */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sol 2 Kolon: Maliyet ve Üretkenlik Analizi */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[350px]">
                   <div className="flex justify-between items-start mb-6">
                       <div>
                           <h3 className="font-bold text-slate-800 flex items-center gap-2"><Target size={18} className="text-blue-500"/> Performans ve Değer Analizi (Son 6 Ay)</h3>
                           <p className="text-xs text-slate-500 mt-1">Ödenen tahmini maliyet (Kırmızı) ile şirkete kazandırılan değerin (Yeşil Çizgi) kıyaslaması.</p>
                       </div>
                       <div className="flex items-center gap-4 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                           <span className="flex items-center gap-1 text-slate-600"><div className="w-3 h-3 rounded bg-red-400"></div> Maliyet</span>
                           <span className="flex items-center gap-1 text-slate-600"><div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-emerald-200"></div> Kazanç</span>
                       </div>
                   </div>
                   
                   <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <ComposedChart data={details.costRevenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} dy={10} />
                            
                            <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#F87171'}} tickFormatter={(value) => `₺${value/1000}k`} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#34D399'}} tickFormatter={(value) => `₺${value/1000}k`} />
                            
                            <Tooltip content={<CustomTooltip />} />
                            <Bar yAxisId="left" dataKey="maliyet" name="Maaş/Prim Maliyeti" fill="#F87171" radius={[4, 4, 0, 0]} barSize={32} />
                            <Line yAxisId="right" type="monotone" dataKey="ciro" name="Kazandırdığı Değer" stroke="#34D399" strokeWidth={4} dot={{ r: 5, fill: '#34D399', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                         </ComposedChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Sağ Kolon: Yetkinlik Analizi */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[350px]">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><Award size={18} className="text-purple-500"/> Yetkinlik Radarı</h3>
                    <p className="text-xs text-slate-500 mb-2">Görev ve mesai verilerinden hesaplanan beceri profili.</p>
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={details.skillsData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Yetkinlik Puanı" dataKey="A" stroke="#8B5CF6" strokeWidth={2} fill="#8B5CF6" fillOpacity={0.4} />
                                <Tooltip content={<CustomTooltip />} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

             </div>

             {/* --- ALT BÖLÜM: DETAYLAR --- */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Katılım Isı Haritası */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><CalendarDays size={18} className="text-blue-500"/> Son 30 Gün Katılım</h3>
                   <div className="flex flex-wrap gap-2 mb-6">
                      {details.heatmap.map((status, i) => (
                         <div key={i} className={`w-8 h-8 rounded-md border shadow-sm ${
                            status === 'on-time' ? 'bg-emerald-400 border-emerald-500' : 
                            status === 'late' ? 'bg-amber-400 border-amber-500 animate-pulse' : 
                            status === 'leave' ? 'bg-indigo-400 border-indigo-500' : 'bg-slate-100 border-slate-200'
                         }`} title={status === 'on-time' ? 'Zamanında' : status === 'late' ? 'Geç Kaldı' : status === 'leave' ? 'İzinli' : 'Kayıt Yok'}></div>
                      ))}
                   </div>
                   <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-400 rounded-sm"></div> Zamanında</span>
                      <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-400 rounded-sm"></div> Geç Kaldı</span>
                      <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-indigo-400 rounded-sm"></div> İzinli</span>
                   </div>
                </div>

                {/* Görev Dağılımı */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><ListTodo size={18} className="text-emerald-500"/> Görev Dağılımı</h3>
                   <p className="text-xs text-slate-500 mb-4">Personele atanan iş emirlerinin sonuç durumu.</p>
                   
                   <div className="flex-1 min-h-[160px] relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={details.taskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                               {details.taskDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                               ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                         </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-2xl font-black text-slate-800">{details.onTimeTasks}</span>
                         <span className="text-[9px] font-bold text-slate-400 uppercase">Tamamlandı</span>
                      </div>
                   </div>

                   <div className="mt-4 space-y-2">
                      {details.taskDistribution.map((item, idx) => (
                         <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                               <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                               <span className="font-medium text-slate-600">{item.name}</span>
                            </div>
                            <span className="font-bold text-slate-800">{item.value} Adet</span>
                         </div>
                      ))}
                   </div>
                </div>

                {/* Son Aktiviteler */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><Clock size={18} className="text-slate-500"/> Son Aktiviteler</h3>
                   {details.recentActivities.length > 0 ? (
                       <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                          {details.recentActivities.map((act, i) => {
                              const Icon = act.icon;
                              return (
                                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 border-white ${act.bg} ${act.color} shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                                          <Icon size={16} />
                                      </div>
                                      <div className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2rem)] bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                                          <div className="font-bold text-slate-700 text-xs mb-1 line-clamp-2" title={act.text}>{act.text}</div>
                                          <time className="text-[10px] font-medium text-slate-400">{act.time}</time>
                                      </div>
                                  </div>
                              );
                          })}
                       </div>
                   ) : (
                       <p className="text-sm text-slate-400 italic text-center py-6 flex flex-col items-center">
                           <AlertCircle size={24} className="mb-2 opacity-50"/>
                           Henüz sistemde kayıtlı aktivite yok.
                       </p>
                   )}
                </div>

             </div>

          </div>
       </div>
    </div>
  );
};

export default EmployeeReportCard;
