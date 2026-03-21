import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      // Başarılı olursa App.jsx otomatik yönlendirecek
    } catch (err) {
      setError('Giriş başarısız: E-posta veya şifre hatalı.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">E-ComPilot</h1>
          <p className="text-slate-500 text-sm">Yönetici paneline erişmek için giriş yapın.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold flex items-center gap-2 mb-6 border border-red-100">
            <AlertCircle size={18}/> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">E-Posta Adresi</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={18}/>
              <input 
                type="email" 
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                placeholder="ornek@sirket.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18}/>
              <input 
                type="password" 
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Panele Giriş Yap'}
            {!loading && <ArrowRight size={18}/>}
          </button>
        </form>

        <div className="mt-8 text-center">
           <p className="text-xs text-slate-400">© 2026 E-ComPilot Enterprise System</p>
        </div>

      </div>
    </div>
  );
};

export default Login;