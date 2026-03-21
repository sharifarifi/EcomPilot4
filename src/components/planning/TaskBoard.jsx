import React, { useState, useEffect } from 'react';
import { 
  Plus, Clock, Search, Trash2, Hash, 
  Eye, Layout, Briefcase, UserCheck, Flame, Send, X, PlayCircle, ShieldAlert, FileText // FileText eklendi
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { subscribeToTasks, addTask, updateTaskStatus, addTaskComment, deleteTask } from '../../firebase/taskService';
import { getAllTeamMembers, getDepartments } from '../../firebase/teamService';

const TaskBoard = () => {
  const { userData } = useAuth();
  const isManager = ['Admin', 'Manager', 'CEO', 'Director'].includes(userData?.role);

  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [filterType, setFilterType] = useState('all'); 
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); 
  const [, setLoading] = useState(true);

  const [newTask, setNewTask] = useState({ 
    title: '', detail: '', priority: 'Orta', 
    dueDate: new Date().toISOString().split('T')[0], 
    assignee: '', assigneeName: '', department: '' 
  });
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const [membersData, deptsData] = await Promise.all([
          getAllTeamMembers(),
          getDepartments()
        ]);
        setTeamMembers(membersData);
        setDepartments(deptsData);
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      }
    };
    fetchTeamData();

    const unsubscribe = subscribeToTasks((data) => {
      setTasks(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      if (!isManager && task.assignee !== userData?.uid) return false;
      if (filterType === 'my') return task.assignee === userData?.uid;
      if (filterType === 'urgent') return task.priority === 'Yüksek';
      return true; 
    });
  };
  const filteredTasks = getFilteredTasks();

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !newTask.assignee) {
      alert("Lütfen başlık ve personel seçiniz."); return;
    }

    try {
      await addTask({
        ...newTask,
        // Detay alanı boşsa varsayılan metin ekle
        detail: newTask.detail || 'Açıklama girilmedi.',
        creator: userData.name,
        assigneeName: teamMembers.find(m => m.uid === newTask.assignee)?.name || 'Bilinmiyor'
      });
      setIsTaskModalOpen(false);
      setNewTask({ title: '', detail: '', priority: 'Orta', dueDate: new Date().toISOString().split('T')[0], assignee: '', department: '' });
    } catch (error) {
      alert("Hata: " + error.message);
    }
  };

  const handleChangeStatus = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus, userData.name);
      if (selectedTask && selectedTask.id === taskId) {
         setSelectedTask(prev => ({...prev, status: newStatus}));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if(window.confirm("Bu görevi silmek istediğinize emin misiniz?")) {
      await deleteTask(taskId);
      if (selectedTask?.id === taskId) setSelectedTask(null);
    }
  };

  const handleAddComment = async () => {
    if(!commentText.trim()) return;
    const newComment = {
      id: Date.now(),
      user: userData.name,
      text: commentText,
      type: 'msg',
      time: new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})
    };
    
    try {
      await addTaskComment(selectedTask.id, newComment);
      setSelectedTask(prev => ({
          ...prev,
          comments: [...(prev.comments || []), newComment]
      }));
      setCommentText('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* FİLTRE BAR */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-100 p-1 rounded-lg">
           <button onClick={() => setFilterType('all')} className={`px-3 py-2 rounded text-xs font-bold flex gap-2 transition ${filterType === 'all' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}><Layout size={14}/> Tümü</button>
           <button onClick={() => setFilterType('my')} className={`px-3 py-2 rounded text-xs font-bold flex gap-2 transition ${filterType === 'my' ? 'bg-white text-blue-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}><UserCheck size={14}/> Bana Atanan</button>
           <button onClick={() => setFilterType('urgent')} className={`px-3 py-2 rounded text-xs font-bold flex gap-2 transition ${filterType === 'urgent' ? 'bg-white text-red-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}><Flame size={14}/> Acil</button>
        </div>
        
        {isManager && (
            <button onClick={() => setIsTaskModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg">
                <Plus size={14}/> Yeni İş
            </button>
        )}
      </div>

      {/* KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)]">
        {['Bekliyor', 'Sürüyor', 'Tamamlandı'].map(status => (
          <div key={status} className="flex flex-col h-full bg-slate-50/50 rounded-xl border border-slate-200">
             <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-xl sticky top-0 z-10 shadow-sm">
                <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status === 'Tamamlandı' ? 'bg-green-500' : status === 'Sürüyor' ? 'bg-blue-500' : 'bg-orange-400'}`}></div> {status}
                </span>
                <span className="bg-slate-100 text-xs font-bold px-2 py-0.5 rounded text-slate-600">{filteredTasks.filter(t => t.status === status).length}</span>
             </div>
             <div className="p-3 space-y-3 overflow-y-auto custom-scrollbar flex-1">
               {filteredTasks.filter(t => t.status === status).map(task => (
                 <div key={task.id} onClick={() => setSelectedTask(task)} className={`bg-white p-3 rounded-lg shadow-sm border group relative hover:shadow-md transition-all cursor-pointer ${task.priority === 'Yüksek' ? 'border-l-4 border-l-red-500' : 'border-slate-200 hover:border-blue-300'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-bold text-slate-400 border px-1.5 py-0.5 rounded flex gap-1 items-center bg-slate-50 font-mono"><Hash size={10}/> {task.id.substring(0,6)}</span>
                       <div className="flex gap-1">
                         <button className="text-slate-400 hover:text-blue-600 p-1 bg-slate-50 rounded"><Eye size={14}/></button>
                         {status !== 'Tamamlandı' && (isManager || task.assignee === userData?.uid) && (
                             <button onClick={(e) => { e.stopPropagation(); handleChangeStatus(task.id, status === 'Bekliyor' ? 'Sürüyor' : 'Tamamlandı'); }} className="text-slate-400 hover:text-green-600 p-1 bg-slate-50 rounded"><PlayCircle size={14}/></button>
                         )}
                         {isManager && (
                             <button onClick={(e) => handleDeleteTask(task.id, e)} className="text-slate-300 hover:text-red-500 p-1 bg-slate-50 rounded"><Trash2 size={14}/></button>
                         )}
                       </div>
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 mb-1 line-clamp-2">{task.title}</h4>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                       <span className="text-[10px] font-bold text-slate-500 flex gap-1 items-center"><Clock size={10}/> {task.dueDate}</span>
                       <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          <div className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[8px] font-bold">{task.assigneeName?.charAt(0)}</div>
                          <span className="text-[10px] font-bold text-slate-600 truncate max-w-[60px]">{task.assigneeName}</span>
                       </div>
                    </div>
                 </div>
               ))}
               {filteredTasks.filter(t => t.status === status).length === 0 && (
                   <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                      <Briefcase size={24} className="mb-2 opacity-20"/>
                      <span className="text-xs italic">Görev yok</span>
                   </div>
               )}
             </div>
          </div>
        ))}
      </div>

      {/* YENİ GÖREV MODALI */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">Yeni İş Emri</h3>
                <button onClick={()=>setIsTaskModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition"><X size={20} className="text-slate-500"/></button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Başlık</label>
                 <input type="text" placeholder="Örn: Stok Sayımı" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition" value={newTask.title} onChange={e=>setNewTask({...newTask, title: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Departman</label>
                    <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white focus:border-blue-500 transition" value={newTask.department} onChange={e=>setNewTask({...newTask, department: e.target.value, assignee: ''})}>
                      <option value="">Seçiniz...</option>
                      {departments.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Personel</label>
                    <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white focus:border-blue-500 transition" value={newTask.assignee} onChange={e=>setNewTask({...newTask, assignee: e.target.value})} disabled={!newTask.department}>
                      <option value="">{newTask.department ? 'Personel Seç' : '-'}</option>
                      {teamMembers.filter(m => m.department === newTask.department).map(p=><option key={p.uid} value={p.uid}>{p.name}</option>)}
                    </select>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Öncelik</label>
                    <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                      {['Düşük', 'Orta', 'Yüksek'].map(p=>(<button key={p} onClick={()=>setNewTask({...newTask, priority: p})} className={`flex-1 text-[10px] py-2 rounded-lg font-bold transition ${newTask.priority===p ? (p==='Yüksek'?'bg-red-500 text-white shadow':'bg-white shadow text-slate-800') : 'text-slate-500 hover:text-slate-700'}`}>{p}</button>))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Son Tarih</label>
                    <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition" value={newTask.dueDate} onChange={e=>setNewTask({...newTask, dueDate: e.target.value})}/>
                  </div>
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Detay</label>
                 <textarea rows="3" placeholder="Açıklama giriniz..." className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none resize-none focus:border-blue-500 transition" value={newTask.detail} onChange={e=>setNewTask({...newTask, detail: e.target.value})}></textarea>
               </div>
               <button onClick={handleAddTask} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2">
                  <Plus size={16}/> İş Emrini Oluştur
               </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAY MODALI */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end p-0 md:p-4">
           <div className="bg-white h-full w-full md:max-w-lg md:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50">
                 <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-500 border border-slate-200 px-2 py-1 rounded-lg bg-white font-mono flex items-center gap-1"><Hash size={12}/> {selectedTask.id.substring(0,6)}</span>
                    <button onClick={()=>setSelectedTask(null)} className="p-1 hover:bg-slate-200 rounded-full transition"><X size={20} className="text-slate-500"/></button>
                 </div>
                 <h2 className="font-bold text-xl text-slate-800 mb-2 leading-tight">{selectedTask.title}</h2>
                 <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                    <UserCheck size={16} className="text-blue-500"/>
                    Atanan: <span className="font-bold text-slate-800">{selectedTask.assigneeName}</span>
                 </div>
                 
                 {(isManager || selectedTask.assignee === userData?.uid) ? (
                     <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                        {['Bekliyor', 'Sürüyor', 'Tamamlandı'].map(s=>(
                            <button key={s} onClick={()=>handleChangeStatus(selectedTask.id, s)} className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${selectedTask.status===s?'bg-slate-900 text-white shadow':'text-slate-500 hover:bg-slate-50'}`}>{s}</button>
                        ))}
                     </div>
                 ) : (
                     <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">
                        <ShieldAlert size={16}/> Sadece görev sahibi durumu değiştirebilir.
                     </div>
                 )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {/* DETAY ALANI BURADA */}
                 <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><FileText size={14}/> Açıklama</h4>
                    <p className="text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedTask.detail || "Açıklama yok."}
                    </p>
                 </div>
                 
                 <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Clock size={14}/> Tarihçe & Yorumlar</h4>
                    <div className="space-y-4 pl-3 border-l-2 border-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                       {selectedTask.comments?.map((c,i)=>(
                           <div key={i} className={`relative pl-4 ${c.type === 'log' ? 'opacity-70' : ''}`}>
                               <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full border-2 border-white ${c.type === 'log' ? 'bg-slate-300' : 'bg-blue-500'}`}></div>
                               <div className="flex justify-between items-baseline mb-1">
                                   <span className={`text-xs font-bold ${c.type === 'log' ? 'text-slate-500' : 'text-slate-800'}`}>{c.user}</span> 
                                   <span className="text-[10px] text-slate-400">{c.time}</span>
                               </div>
                               <p className={`text-sm ${c.type === 'log' ? 'text-slate-500 italic text-xs' : 'text-slate-700 bg-slate-50 p-2 rounded-lg rounded-tl-none'}`}>{c.text}</p>
                           </div>
                       ))}
                       {(!selectedTask.comments || selectedTask.comments.length === 0) && <div className="text-xs text-slate-400 italic">Henüz hareket yok.</div>}
                    </div>
                    
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        <input 
                            className="border border-slate-200 rounded-xl px-4 py-2 flex-1 text-sm outline-none focus:border-blue-500 transition" 
                            placeholder="Yorum yaz..." 
                            value={commentText} 
                            onChange={e=>setCommentText(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} 
                        />
                        <button onClick={handleAddComment} className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 transition shadow-md"><Send size={16}/></button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
export default TaskBoard;
