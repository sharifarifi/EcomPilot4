import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Download, Search, TrendingUp, TrendingDown, 
  CheckCircle, Clock, AlertCircle, Award, Briefcase, Zap, 
  BarChart2, Layers, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

// FİREBASE
import { getAllTeamMembers, getDepartments } from '../../firebase/teamService';
import { subscribeToTasks } from '../../firebase/taskService';
import { subscribeToShifts } from '../../firebase/shiftService';
import { subscribeToLeaves } from '../../firebase/leaveService';

// YENİ EKLEDİĞİMİZ BİLEŞENİ İÇE AKTARIYORUZ
import EmployeeReportCard from './EmployeeReportCard';

// --- DEMO VERİLER ---
const DEMO_TREND_DATA = [ { name: '1 Mar', tamamlanan: 45, hedef: 40 }, { name: '2 Mar', tamamlanan: 52, hedef: 40 }, { name: '3 Mar', tamamlanan: 38, hedef: 40 }, { name: '4 Mar', tamamlanan: 65, hedef: 40 }, { name: '5 Mar', tamamlanan: 48, hedef: 40 }, { name: '6 Mar', tamamlanan: 50, hedef: 40 }, { name: '7 Mar', tamamlanan: 58, hedef: 40 } ];
const DEMO_ATTENDANCE_DATA = [ { name: 'Zamanında', value: 85, color: '#10B981' }, { name: 'Geç Kaldı', value: 10, color: '#F59E0B' }, { name: 'İzinli', value: 5, color: '#6366F1' } ];
const DEMO_DEPT_EFFICIENCY = [ { name: 'Pazarlama', verimlilik: 95 }, { name: 'Tasarım', verimlilik: 92 }, { name: 'Yazılım', verimlilik: 88 }, { name: 'Satış', verimlilik: 85 }, { name: 'Lojistik', verimlilik: 78 } ];
const DEMO_EMPLOYEES = [
  { id: 'd1', name: 'Merve K.', role: 'Pazarlama', department: 'Pazarlama', avatar: 'M', avatarColor: 'bg-pink-100 text-pink-600', tasks: 45, late: 0, overtime: '12s', score: 98, trend: 'up' },
  { id: 'd2', name: 'Caner B.', role: 'Yazılım Uzmanı', department: 'Yazılım', avatar: 'C', avatarColor: 'bg-blue-100 text-blue-600', tasks: 28, late: 1, overtime: '22s', score: 92, trend: 'up' },
  { id: 'd3', name: 'Ahmet Y.', role: 'Depo Sorumlusu', department: 'Lojistik', avatar: 'A', avatarColor: 'bg-orange-100 text-orange-600', tasks: 120, late: 3, overtime: '5s', score: 85, trend: 'down' },
  { id: 'd4', name: 'Ali V.', role: 'Satış Temsilcisi', department: 'Satış', avatar: 'A', avatarColor: 'bg-green-100 text-green-600', tasks: 85, late: 5, overtime: '2s', score: 72, trend: 'down' },
];

const PersonnelPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [leaves, setLeaves] = useState([]);

  const [dateRange, setDateRange] = useState('Bu Ay');
  const [selectedDept, setSelectedDept] = useState('Tümü');
  const [searchTerm, setSearchTerm] = useState('');
  
  // YENİ STATE: Karne için seçilen personel
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersData, deptsData] = await Promise.all([ getAllTeamMembers(), getDepartments() ]);
        setTeamMembers(membersData || []); setDepartments(deptsData || []);
      } catch (error) { console.error("Veri çekme hatası:", error); }
    };
    fetchData();

    const unsubTasks = subscribeToTasks(setTasks);
    const unsubShifts = subscribeToShifts(setShifts);
    const unsubLeaves = subscribeToLeaves(setLeaves);

    setTimeout(() => setLoading(false), 800);
    return () => { unsubTasks(); unsubShifts(); unsubLeaves(); };
  }, []);

  const dateLimits = useMemo(() => {
    const today = new Date(); let start = new Date(); let end = new Date();
    if (dateRange === 'Bu Hafta') { start.setDate(today.getDate() - 7); } 
    else if (dateRange === 'Bu Ay') { start.setDate(1); } 
    else if (dateRange === 'Geçen Ay') { start.setMonth(today.getMonth() - 1); start.setDate(1); end.setDate(0); } 
    else if (dateRange === 'Bu Yıl') { start.setMonth(0, 1); }
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }, [dateRange]);

  const { employeeList, kpiStats, trendData, attendanceData, deptEfficiency, isDemoMode } = useMemo(() => {
    const filteredTasks = tasks.filter(t => t.dueDate >= dateLimits.start && t.dueDate <= dateLimits.end);
    const filteredShifts = shifts.filter(s => s.date >= dateLimits.start && s.date <= dateLimits.end);
    const filteredLeaves = leaves.filter(l => l.start >= dateLimits.start && l.start <= dateLimits.end && l.status === 'Onaylandı');

    const hasRealData = filteredTasks.length > 0 || filteredShifts.length > 0;

    if (!hasRealData || teamMembers.length === 0) {
        return {
            employeeList: DEMO_EMPLOYEES.filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase())),
            kpiStats: { tasks: 1284, avgEfficiency: 88, lateRate: 4, overtimeHours: 142 },
            trendData: DEMO_TREND_DATA, attendanceData: DEMO_ATTENDANCE_DATA, deptEfficiency: DEMO_DEPT_EFFICIENCY,
            isDemoMode: true
        };
    }

    let totalCompletedTasks = 0; let totalLates = 0; let totalOvertimeMins = 0; let totalScoreSum = 0; let totalShiftsCount = filteredShifts.length; let onTimeCount = 0; let leaveCount = filteredLeaves.reduce((acc, l) => acc + l.days, 0);
    const deptScores = {};

    const processedEmployees = teamMembers.map(member => {
      const memberTasks = filteredTasks.filter(t => t.assignee === member.uid || t.assigneeName === member.name);
      const memberShifts = filteredShifts.filter(s => s.userId === member.uid || s.user === member.name);
      
      const completedTasks = memberTasks.filter(t => t.status === 'Tamamlandı').length;
      totalCompletedTasks += completedTasks;

      let lateCount = 0; let overtimeMins = 0;

      memberShifts.forEach(shift => {
        if (shift.note?.toLowerCase().includes('geç') || (shift.checkIn && shift.checkIn > '09:15')) { lateCount++; totalLates++; } 
        else { onTimeCount++; }

        if (shift.checkOut && shift.checkOut > '18:00') {
          const [hOut, mOut] = shift.checkOut.split(':').map(Number);
          const diff = (hOut * 60 + mOut) - (18 * 60);
          if (diff > 0) { overtimeMins += diff; totalOvertimeMins += diff; }
        }
      });

      let score = 80 + (completedTasks * 2) - (lateCount * 5) + Math.floor(overtimeMins / 60);
      if (score > 100) score = 100; if (score < 0) score = 0;
      totalScoreSum += score;

      const deptName = departments.find(d => d.id === member.department)?.label || 'Diğer';
      if (!deptScores[deptName]) deptScores[deptName] = { total: 0, count: 0 };
      deptScores[deptName].total += score; deptScores[deptName].count += 1;

      return {
        id: member.uid, name: member.name, role: member.role, department: deptName,
        avatar: member.name ? member.name.charAt(0).toUpperCase() : '?',
        avatarColor: member.avatarColor || 'bg-slate-200 text-slate-600',
        tasks: completedTasks, late: lateCount, overtime: Math.floor(overtimeMins / 60) + 's',
        score: score, trend: score >= 85 ? 'up' : 'down'
      };
    });

    const finalDeptEfficiency = Object.keys(deptScores).map(key => ({ name: key, verimlilik: Math.round(deptScores[key].total / deptScores[key].count) })).sort((a,b) => b.verimlilik - a.verimlilik);
    const finalAttendanceData = [ { name: 'Zamanında', value: onTimeCount || 1, color: '#10B981' }, { name: 'Geç Kaldı', value: totalLates, color: '#F59E0B' }, { name: 'İzinli', value: leaveCount, color: '#6366F1' } ];
    
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0];
    });

    const finalTrendData = last7Days.map(dateStr => {
      const dayTasks = tasks.filter(t => t.dueDate === dateStr && t.status === 'Tamamlandı').length;
      return { name: new Date(dateStr).toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'}), tamamlanan: dayTasks, hedef: Math.max(5, Math.floor(teamMembers.length * 1.5)) };
    });

    const filteredEmployees = processedEmployees
      .filter(emp => selectedDept === 'Tümü' || emp.department === selectedDept)
      .filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a,b) => b.score - a.score);

    return {
      employeeList: filteredEmployees,
      kpiStats: { tasks: totalCompletedTasks, avgEfficiency: teamMembers.length ? Math.round(totalScoreSum / teamMembers.length) : 0, lateRate: totalShiftsCount ? Math.round((totalLates / totalShiftsCount) * 100) : 0, overtimeHours: Math.floor(totalOvertimeMins / 60) },
      trendData: finalTrendData, attendanceData: finalAttendanceData, deptEfficiency: finalDeptEfficiency, isDemoMode: false
    };
  }, [teamMembers, tasks, shifts, leaves, dateLimits, selectedDept, searchTerm, departments]);

  const handleExport = () => {
    let csv = "data:text/csv;charset=utf-8,Personel,Departman,Rol,Tamamlanan Is,Gec Kalma,Fazla Mesai,Verimlilik Puani\n";
    employeeList.forEach(e => { csv += `"${e.name}","${e.department}","${e.role}",${e.tasks},${e.late},"${e.overtime}",${e.score}\n`; });
    const link = document.createElement("a"); link.href = encodeURI(csv); link.download = `Personel_Performans_${dateRange}.csv`; link.click();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-sm">
          <p className="font-bold mb-2 border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-0.5">
               <span className="flex items-center gap-1">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                 <span className="text-slate-300">{entry.name === 'verimlilik' ? 'Verimlilik Puanı' : entry.name}:</span>
               </span>
               <span className="font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-400"><Loader2 className="animate-spin mr-2" size={32}/> Veriler Analiz Ediliyor...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 relative">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">Personel Performans Analizi</h2>
             {isDemoMode && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse">Önizleme Modu</span>}
          </div>
          <p className="text-sm text-slate-500 mt-1">Ekibinizin operasyonel verimliliğini ve katılım metriklerini izleyin.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
           <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <Calendar size={16} className="text-slate-400"/>
              <select value={dateRange} onChange={e=>setDateRange(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer">
                 <option>Bu Hafta</option><option>Bu Ay</option><option>Geçen Ay</option><option>Bu Yıl</option>
              </select>
           </div>
           <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <Briefcase size={16} className="text-slate-400"/>
              <select value={selectedDept} onChange={e=>setSelectedDept(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer">
                 <option value="Tümü">Tüm Departmanlar</option>
                 {departments.map(d => <option key={d.id} value={d.label}>{d.label}</option>)}
              </select>
           </div>
           <button onClick={handleExport} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg">
              <Download size={16}/> Raporu İndir
           </button>
        </div>
      </div>

      {/* KPI KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-all">
            <div className="flex justify-between items-start mb-2">
               <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tamamlanan Görev</p>
               <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition"><CheckCircle size={16}/></div>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{kpiStats.tasks}</h3>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group hover:border-emerald-300 transition-all">
            <div className="flex justify-between items-start mb-2">
               <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ort. Verimlilik Puanı</p>
               <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition"><Zap size={16}/></div>
            </div>
            <h3 className="text-3xl font-black text-slate-800">%{kpiStats.avgEfficiency}</h3>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group hover:border-orange-300 transition-all">
            <div className="flex justify-between items-start mb-2">
               <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Geç Kalma Oranı</p>
               <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition"><Clock size={16}/></div>
            </div>
            <h3 className="text-3xl font-black text-slate-800">%{kpiStats.lateRate}</h3>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group hover:border-purple-300 transition-all">
            <div className="flex justify-between items-start mb-2">
               <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Toplam Fazla Mesai</p>
               <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition"><AlertCircle size={16}/></div>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{kpiStats.overtimeHours} <span className="text-sm font-medium text-slate-400">Saat</span></h3>
         </div>
      </div>

      {/* GRAFİKLER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
               <div><h3 className="font-bold text-slate-800 flex items-center gap-2"><BarChart2 size={18} className="text-blue-500"/> Görev Tamamlama Trendi (Son 7 Gün)</h3></div>
               <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1 text-slate-600"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Gerçekleşen</span>
                  <span className="flex items-center gap-1 text-slate-400"><div className="w-3 h-3 rounded-full border-2 border-slate-300 border-dashed"></div> Hedef</span>
               </div>
            </div>
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs><linearGradient id="colorTamamlanan" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient></defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                     <Tooltip content={<CustomTooltip />} />
                     <Area type="monotone" dataKey="hedef" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                     <Area type="monotone" dataKey="tamamlanan" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorTamamlanan)" activeDot={{ r: 6, strokeWidth: 0, fill: '#1E40AF' }} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><PieChart size={18} className="text-emerald-500"/> Katılım Durumu</h3>
            <div className="flex-1 min-h-[200px] relative flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={attendanceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {attendanceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                     </Pie>
                     <Tooltip content={<CustomTooltip />} />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-slate-800">%{isDemoMode ? 85 : 100 - kpiStats.lateRate}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Zamanında</span>
               </div>
            </div>
            <div className="mt-4 space-y-2">
               {attendanceData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                     <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div><span className="font-medium text-slate-600">{item.name}</span></div>
                     <span className="font-bold text-slate-800">{item.value}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* ALT TABLOLAR */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-fit self-start w-full">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><Layers size={18} className="text-purple-500"/> Departman Verimliliği</h3>
            <div className="w-full" style={{ height: Math.max(200, deptEfficiency.length * 55) }}>
               {deptEfficiency.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptEfficiency} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} width={80} />
                       <Tooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip />} />
                       <Bar dataKey="verimlilik" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={24}>
                          {deptEfficiency.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.verimlilik >= 90 ? '#10B981' : entry.verimlilik < 80 ? '#F59E0B' : '#8B5CF6'} />)}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
               ) : (<div className="h-full flex items-center justify-center text-sm text-slate-400">Veri bulunamadı.</div>)}
            </div>
         </div>

         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm xl:col-span-2 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
               <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Award size={18} className="text-amber-500"/> Personel Karnesi (Detay İçin Tıklayın)</h3>
               </div>
               <div className="relative w-full sm:w-48">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                  <input type="text" placeholder="Personel ara..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400 transition shadow-sm"/>
               </div>
            </div>
            
            <div className="flex-1 overflow-x-auto min-h-[250px]">
               <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-white text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 sticky top-0">
                     <tr>
                        <th className="px-6 py-4">Personel</th>
                        <th className="px-6 py-4 text-center">Tamamlanan İş</th>
                        <th className="px-6 py-4 text-center">Geç Kalma</th>
                        <th className="px-6 py-4 text-center">Fazla Mesai</th>
                        <th className="px-6 py-4 text-right">Verimlilik Puanı</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {employeeList.length > 0 ? employeeList.map((emp, index) => (
                        <tr 
                          key={emp.id} 
                          onClick={() => setSelectedEmployee(emp)}
                          className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        >
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="relative">
                                    <div className={`w-9 h-9 rounded-full ${emp.avatarColor} border border-slate-200 flex items-center justify-center font-bold text-xs shadow-sm group-hover:border-blue-300 transition`}>{emp.avatar}</div>
                                    {index === 0 && emp.score > 80 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm"><Award size={8} className="text-white"/></div>}
                                 </div>
                                 <div>
                                    <div className="font-bold text-slate-800 group-hover:text-blue-600 transition">{emp.name}</div>
                                    <div className="text-[10px] text-slate-400">{emp.department} • {emp.role}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center font-bold text-slate-700">{emp.tasks} <span className="text-[10px] font-normal text-slate-400">Adet</span></td>
                           <td className="px-6 py-4 text-center">
                              {emp.late > 0 ? <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md text-xs font-bold">{emp.late} Kez</span> : <span className="text-slate-300">-</span>}
                           </td>
                           <td className="px-6 py-4 text-center font-medium text-slate-600">{emp.overtime}</td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 {emp.trend === 'up' ? <TrendingUp size={14} className="text-green-500"/> : <TrendingDown size={14} className="text-red-400"/>}
                                 <div className={`px-3 py-1 rounded-lg text-sm font-black border shadow-sm ${
                                    emp.score >= 90 ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-100' :
                                    emp.score >= 80 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-100' :
                                    'bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 border-orange-100'
                                 }`}>
                                    {emp.score}
                                 </div>
                              </div>
                           </td>
                        </tr>
                     )) : (
                        <tr><td colSpan="5" className="text-center py-10 text-slate-400 text-sm">Veri bulunamadı.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {/* DIŞARI ÇIKARDIĞIMIZ MODAL BİLEŞENİ ÇAĞRILIYOR */}
      {selectedEmployee && (
        <EmployeeReportCard 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
        />
      )}

    </div>
  );
};

export default PersonnelPerformance;