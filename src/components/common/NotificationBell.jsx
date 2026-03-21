import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToNotifications, markNotificationAsRead } from '../../firebase/notificationService';

const NotificationBell = () => {
  const { userData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Bildirimleri Dinle
  useEffect(() => {
    if (userData?.uid) {
      const unsubscribe = subscribeToNotifications(userData.uid, (data) => {
        setNotifications(data);
      });
      return () => unsubscribe();
    }
  }, [userData]);

  // Dışarı tıklayınca kapatma
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id, e) => {
    e.stopPropagation();
    markNotificationAsRead(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition relative text-slate-600"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-50 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h4 className="font-bold text-slate-800 text-sm">Bildirimler</h4>
            <span className="text-xs text-slate-500">{unreadCount} okunmamış</span>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition flex gap-3 ${notif.isRead ? 'opacity-60' : 'bg-blue-50/30'}`}
                >
                  <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${notif.isRead ? 'bg-slate-300' : 'bg-blue-500'}`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 leading-snug">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Az önce'}
                    </span>
                  </div>
                  {!notif.isRead && (
                    <button 
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      className="text-slate-400 hover:text-blue-600 self-start"
                      title="Okundu işaretle"
                    >
                      <Check size={16}/>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm italic">
                Bildiriminiz yok.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;