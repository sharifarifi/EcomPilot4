import React from 'react';
import { Wifi, Settings, Check, X, Activity } from 'lucide-react';

const IntegrationCard = ({ app, onManage }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all group relative overflow-hidden flex flex-col h-full">
       
       {/* Arkaplan Deseni */}
       <div className={`absolute top-0 right-0 w-24 h-24 bg-${app.color}-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>

       <div className="flex justify-between items-start z-10 mb-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-white border border-slate-100 shadow-sm text-2xl font-black text-${app.color}-600`}>
             {app.logo}
          </div>
          {app.status === 'connected' ? (
             <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-green-200 animate-pulse">
                <Wifi size={12}/> CANLI
             </div>
          ) : (
             <div className="flex items-center gap-1.5 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200">
                BAĞLI DEĞİL
             </div>
          )}
       </div>

       <div className="z-10 flex-1">
          <h4 className="font-bold text-lg text-slate-800">{app.name}</h4>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{app.desc}</p>
       </div>

       <div className="mt-6 pt-4 border-t border-slate-100 z-10 flex items-center justify-between">
          {app.status === 'connected' && app.logs && app.logs.length > 0 ? (
             <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Activity size={12} className="text-green-500"/> {app.logs[0].msg.substring(0, 15)}...
             </div>
          ) : (
             <div className="text-[10px] text-slate-400">Veri akışı bekleniyor...</div>
          )}
          <button 
            onClick={() => onManage(app)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              app.status === 'connected' 
              ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' 
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
            }`}
          >
             {app.status === 'connected' ? <><Settings size={14}/> Yönet</> : 'Kurulum'}
          </button>
       </div>
    </div>
  );
};

export default IntegrationCard;