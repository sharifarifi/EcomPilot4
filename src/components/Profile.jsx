import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateTeamMember, updateUserPassword } from '../firebase/teamService';
import { User, Mail, Phone, Briefcase, Lock, Save, Loader2, CheckCircle, Shield } from 'lucide-react';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-pink-100 text-pink-600', 
  'bg-orange-100 text-orange-600', 'bg-green-100 text-green-600', 'bg-teal-100 text-teal-600',
  'bg-slate-100 text-slate-600', 'bg-red-100 text-red-600'
];

const Profile = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatarColor: '',
    department: '', // Sadece gösterim için (düzenlenemez)
    role: ''        // Sadece gösterim için
  });

  // Şifre State
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Verileri Yükle
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        avatarColor: userData.avatarColor || AVATAR_COLORS[0],
        department: userData.department || 'Belirtilmemiş',
        role: userData.role || 'Personel'
      });
    }
  }, [userData]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // 1. Profil Bilgilerini Güncelle (Firestore)
      await updateTeamMember(userData.uid, {
        name: formData.name,
        phone: formData.phone,
        avatarColor: formData.avatarColor
      });

      // 2. Şifre Değişikliği Varsa (Auth)
      if (passwords.newPassword) {
        if (passwords.newPassword.length < 6) {
          throw new Error("Şifre en az 6 karakter olmalıdır.");
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
          throw new Error("Şifreler uyuşmuyor.");
        }
        await updateUserPassword(currentUser, passwords.newPassword);
      }

      setSuccessMessage("Profiliniz başarıyla güncellendi.");
      // Şifre alanlarını temizle
      setPasswords({ newPassword: '', confirmPassword: '' });
      
      // Mesajı 3 saniye sonra kaldır
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      alert("Hata: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Profilim</h2>
        <p className="text-sm text-slate-500">Kişisel bilgilerinizi ve hesap ayarlarınızı yönetin.</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 animate-in slide-in-from-top-2">
          <CheckCircle size={20}/>
          <span className="font-bold text-sm">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL KOLON: Profil Kartı & Avatar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl font-bold shadow-inner mb-4 ${formData.avatarColor}`}>
              {formData.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-xl font-bold text-slate-800">{formData.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{currentUser?.email}</p>
            
            <div className="flex justify-center gap-2 mb-6">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200">
                {formData.role}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100">
                {formData.department}
              </span>
            </div>

            <div className="border-t border-slate-100 pt-4 text-left">
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Avatar Rengi Seç</label>
              <div className="flex flex-wrap justify-center gap-2">
                {AVATAR_COLORS.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setFormData({ ...formData, avatarColor: color })}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 border-2 ${color} ${formData.avatarColor === color ? 'border-slate-800 ring-2 ring-slate-200' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: Form Alanları */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdateProfile} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            
            {/* Kişisel Bilgiler */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2 border-b pb-2">
                <User size={16}/> Kişisel Bilgiler
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Ad Soyad</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Telefon</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-3 text-slate-400"/>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+90 5XX XXX XX XX"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Salt Okunur Alanlar */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2 border-b pb-2 mt-2">
                <Shield size={16}/> Hesap Bilgileri
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">E-Posta (Değiştirilemez)</label>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium cursor-not-allowed">
                    <Mail size={16}/> {currentUser?.email}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Departman</label>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium cursor-not-allowed">
                    <Briefcase size={16}/> {formData.department}
                  </div>
                </div>
              </div>
            </div>

            {/* Şifre Değiştirme */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2 border-b pb-2 mt-2">
                <Lock size={16}/> Güvenlik
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Yeni Şifre</label>
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                    placeholder="Değiştirmek istemiyorsanız boş bırakın"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Şifre Tekrar</label>
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    disabled={!passwords.newPassword}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Kaydet Butonu */}
            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>}
                Değişiklikleri Kaydet
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;