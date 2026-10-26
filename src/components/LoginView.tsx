import React, { useState } from 'react';
import { Store, Lock, User as UserIcon, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { StoreSettings } from '../types';

interface LoginViewProps {
  settings: StoreSettings;
  onLogin: (username: string, password: string) => boolean;
  onQuickLogin: (username: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  settings,
  onLogin,
  onQuickLogin,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = onLogin(username, password);
    if (!success) {
      setErrorMsg('Username atau password salah! (Coba: admin / admin123 atau kasir / kasir123)');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Top Header */}
        <div className="bg-slate-900 p-8 text-center text-white relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg mb-3">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">{settings.store_name}</h1>
          <p className="text-xs text-slate-400 mt-1">Sistem Point of Sale (POS) & Manajemen Kasir</p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Username Pengguna
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / kasir"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Masuk ke Sistem POS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Credentials */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Akses Cepat Akun Demo (1-Klik)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('admin123');
                  onQuickLogin('admin');
                }}
                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 transition-all text-left group"
              >
                <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">admin / admin123</p>
                <p className="text-[9px] text-amber-600 font-medium mt-0.5">Akses penuh semua fitur</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername('kasir');
                  setPassword('kasir123');
                  onQuickLogin('kasir');
                }}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 transition-all text-left group"
              >
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Kasir (Operator)</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">kasir / kasir123</p>
                <p className="text-[9px] text-emerald-600 font-medium mt-0.5">Hanya POS & nota sendiri</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
