import React, { useState } from 'react';
import { StoreSettings } from '../types';
import { Store, Save, CheckCircle2 } from 'lucide-react';

interface StoreSettingsViewProps {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
}

export const StoreSettingsView: React.FC<StoreSettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Pengaturan Toko & Nota Kasir</h2>
        <p className="text-xs text-slate-500">
          Ubah identitas toko yang tercetak pada nota thermal kasir, besaran tarif pajak, dan format kertas default.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nama Toko / Usaha <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                className="w-full text-sm font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Alamat Lengkap Toko
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nomor Telepon / WhatsApp Toko
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Pajak / PPN Standar (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.tax_percent}
                onChange={(e) => setFormData({ ...formData, tax_percent: Number(e.target.value) || 0 })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono-numbers focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Ukuran Kertas Printer Thermal Default
              </label>
              <select
                value={formData.paper_size}
                onChange={(e) => setFormData({ ...formData, paper_size: e.target.value as '58mm' | '80mm' })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
              >
                <option value="58mm">58 mm (Printer Kasir Mini / Bluetooth)</option>
                <option value="80mm">80 mm (Printer Thermal Standar / EPSON TM-T82)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Pesan Footer pada Nota Thermal
              </label>
              <textarea
                rows={2}
                value={formData.receipt_footer}
                onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
                placeholder="Pesan ucapan terima kasih atau ketentuan pengembalian barang..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pengaturan toko berhasil diperbarui!</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Toko</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
