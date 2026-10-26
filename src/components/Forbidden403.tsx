import React from 'react';
import { ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react';

interface Forbidden403Props {
  onBackToPos: () => void;
  onSwitchToAdmin: () => void;
}

export const Forbidden403: React.FC<Forbidden403Props> = ({
  onBackToPos,
  onSwitchToAdmin,
}) => {
  return (
    <div className="flex-1 min-h-[calc(100vh-62px)] flex items-center justify-center p-6 bg-slate-100">
      <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="text-3xl font-black text-slate-800 tracking-tight font-mono">403</span>
          <h2 className="text-lg font-bold text-slate-800 mt-1">Akses Ditolak (Forbidden)</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Halaman ini khusus untuk peran <span className="font-semibold text-slate-700">Administrator</span>. 
            Akun Anda saat ini memiliki hak akses sebagai <span className="font-semibold text-slate-700">Operator / Kasir</span> yang hanya diizinkan untuk transaksi kasir dan riwayat transaksi milik sendiri.
          </p>
        </div>

        <div className="pt-3 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={onBackToPos}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Kasir</span>
          </button>

          <button
            onClick={onSwitchToAdmin}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            <span>Login Sebagai Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
};
