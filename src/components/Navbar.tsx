import React, { useState, useEffect } from 'react';
import { User, StoreSettings } from '../types';
import { 
  ShoppingCart, 
  LayoutDashboard, 
  Package, 
  Boxes, 
  FileText, 
  Users, 
  Settings as SettingsIcon, 
  History, 
  ShieldAlert, 
  Code2, 
  LogOut, 
  UserCheck, 
  Clock, 
  Store,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  settings: StoreSettings;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  onSwitchUser: (username: string) => void;
  allUsers: User[];
  onChangePasswordClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  settings,
  activeTab,
  onSelectTab,
  onLogout,
  onSwitchUser,
  allUsers,
  onChangePasswordClick,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(now);
      setTimeStr(`${formatted} WIB`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 select-none">
      <div className="flex items-center justify-between px-4 py-2.5 gap-4">
        {/* Left: Brand & Store */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold text-lg shadow-sm">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-tight text-base whitespace-nowrap">
                {settings.store_name}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isAdmin ? 'Administrator' : 'Kasir POS'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono-numbers">{timeStr}</span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Menus */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => onSelectTab('pos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pos' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Kasir POS</span>
          </button>

          <button
            onClick={() => onSelectTab('transactions')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'transactions' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Transaksi</span>
          </button>

          {/* Admin Tabs */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onSelectTab('products')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'products' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produk</span>
          </button>

          <button
            onClick={() => onSelectTab('stock')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'stock' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Stok</span>
          </button>

          <button
            onClick={() => onSelectTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'reports' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Laporan</span>
          </button>

          <button
            onClick={() => onSelectTab('users')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'users' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pengguna</span>
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'settings' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Toko</span>
          </button>
        </nav>

        {/* Right: PHP/SQL Code Viewer & User Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('source_code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              activeTab === 'source_code'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700/80 hover:text-emerald-300'
            }`}
            title="Skema Database Supabase, RLS Policies & Konfigurasi API Key"
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden sm:inline">Supabase & SQL</span>
          </button>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-400/30">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden md:block leading-tight text-xs">
                <p className="font-semibold text-slate-100">{currentUser.name.split(' ')[0]}</p>
                <p className="text-[11px] text-slate-400 capitalize">{currentUser.role}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="font-semibold text-slate-100">{currentUser.name}</p>
                  <p className="text-slate-400 font-mono text-[11px]">@{currentUser.username} · {currentUser.role}</p>
                  {currentUser.must_change_password && (
                    <span className="inline-block mt-1 text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      Wajib ganti password
                    </span>
                  )}
                </div>

                <div className="p-2">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onChangePasswordClick();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Ganti Password</span>
                  </button>

                  <div className="my-1.5 border-t border-slate-800" />
                  <p className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Ganti Akun Demo:
                  </p>
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u.username);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                        u.username === currentUser.username
                          ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{u.name}</span>
                      <span className="text-[10px] uppercase font-mono px-1 rounded bg-slate-800 text-slate-300">
                        {u.role}
                      </span>
                    </button>
                  ))}

                  <div className="my-1.5 border-t border-slate-800" />
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav strip */}
      <div className="flex lg:hidden overflow-x-auto px-4 py-2 border-t border-slate-800 gap-2 scrollbar-none">
        <button
          onClick={() => onSelectTab('pos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            activeTab === 'pos' ? 'bg-indigo-600 text-white' : 'text-slate-300 bg-slate-800'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Kasir</span>
        </button>
        <button
          onClick={() => onSelectTab('transactions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            activeTab === 'transactions' ? 'bg-indigo-600 text-white' : 'text-slate-300 bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Riwayat</span>
        </button>
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-300 bg-slate-800'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => onSelectTab('products')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            activeTab === 'products' ? 'bg-indigo-600 text-white' : 'text-slate-300 bg-slate-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Produk</span>
        </button>
        <button
          onClick={() => onSelectTab('stock')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            activeTab === 'stock' ? 'bg-indigo-600 text-white' : 'text-slate-300 bg-slate-800'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Stok</span>
        </button>
        <button
          onClick={() => onSelectTab('reports')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'text-slate-300 bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Laporan</span>
        </button>
      </div>
    </header>
  );
};
