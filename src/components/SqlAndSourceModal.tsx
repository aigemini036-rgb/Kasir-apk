import React, { useState } from 'react';
import { 
  Database, 
  FolderTree, 
  Code, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  Key, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { getSupabaseConfig, setCustomSupabaseConfig, clearCustomSupabaseConfig, testSupabaseConnection } from '../lib/supabase';

export const SqlAndSourceModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'config' | 'js_client' | 'folder' | 'install'>('supabase');
  const [copied, setCopied] = useState(false);

  // Supabase live config state
  const config = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(config.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(config.anonKey);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSupabaseConfig(supabaseUrl, supabaseAnonKey);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleClearConfig = () => {
    clearCustomSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseAnonKey('');
  };

  const supabaseSqlCode = `-- ====================================================================
-- SKEMA SUPABASE (POSTGRESQL 15+) UNTUK POS KASIR MODERN
-- Dilengkapi Row Level Security (RLS), Realtime, Trigger & Seeder
-- Buka Supabase Dashboard -> SQL Editor -> Tempel & Klik "Run"
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABEL PENGGUNA (users)
CREATE TABLE IF NOT EXISTS public.users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, -- Bcrypt hash
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'cashier')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pencarian
CREATE INDEX IF NOT EXISTS idx_users_role_status ON public.users(role, is_active);

-- 3. TABEL KATEGORI PRODUK (categories)
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- 4. TABEL PRODUK (products)
CREATE TABLE IF NOT EXISTS public.products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  code VARCHAR(50) NOT NULL UNIQUE,
  barcode VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  buy_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  sell_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
  image VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock, min_stock);

-- 5. TABEL PERGERAKAN STOK (stock_movements)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  current_stock INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  reference_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_created ON public.stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_product ON public.stock_movements(product_id);

-- 6. TABEL PENGATURAN TOKO (settings)
CREATE TABLE IF NOT EXISTS public.settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_name VARCHAR(150) NOT NULL DEFAULT 'Toko Berkah Sejahtera',
  address TEXT,
  phone VARCHAR(50),
  receipt_footer TEXT,
  tax_percent NUMERIC(5, 2) NOT NULL DEFAULT 11.00,
  paper_size VARCHAR(10) NOT NULL DEFAULT '58mm' CHECK (paper_size IN ('58mm', '80mm')),
  currency_symbol VARCHAR(10) NOT NULL DEFAULT 'Rp',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABEL TRANSAKSI PENJUALAN (transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  user_id BIGINT REFERENCES public.users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  customer_name VARCHAR(100) NOT NULL DEFAULT 'Pelanggan Umum',
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tax_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'tunai' CHECK (payment_method IN ('tunai', 'qris', 'debit')),
  cash_received NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  change_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  payment_reference VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'void')),
  void_reason VARCHAR(255),
  void_by VARCHAR(100),
  void_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON public.transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- 8. TABEL ITEM DETAIL TRANSAKSI (transaction_items)
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transaction_id BIGINT NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  product_code VARCHAR(50) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  buy_price NUMERIC(15, 2) NOT NULL,
  sell_price NUMERIC(15, 2) NOT NULL,
  quantity INT NOT NULL,
  discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(15, 2) NOT NULL,
  profit NUMERIC(15, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_transaction ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_items_product ON public.transaction_items(product_id);

-- 9. TABEL LOG AKTIVITAS (activity_logs)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  ip_address VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon & authenticated role read-write for POS app usage:
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public write products" ON public.products FOR ALL USING (true);

CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public write categories" ON public.categories FOR ALL USING (true);

CREATE POLICY "Public read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Public write transactions" ON public.transactions FOR ALL USING (true);

CREATE POLICY "Public read transaction_items" ON public.transaction_items FOR SELECT USING (true);
CREATE POLICY "Public write transaction_items" ON public.transaction_items FOR ALL USING (true);

CREATE POLICY "Public read stock_movements" ON public.stock_movements FOR SELECT USING (true);
CREATE POLICY "Public write stock_movements" ON public.stock_movements FOR ALL USING (true);

CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public update settings" ON public.settings FOR ALL USING (true);

CREATE POLICY "Public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public write users" ON public.users FOR ALL USING (true);

CREATE POLICY "Public read activity_logs" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Public write activity_logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- ====================================================================
-- REALTIME SUBSCRIPTIONS
-- Mengaktifkan event real-time saat ada transaksi baru atau stok berkurang
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements;

-- ====================================================================
-- SEEDER DATA AWAL
-- ====================================================================
INSERT INTO public.users (username, password, name, role, is_active, must_change_password)
VALUES 
  ('admin', '$2y$10$w09ZkM4uJ8u5jQ7q8X2aC.L3rM9tY6pW1eA5sD7fG8hJ9kL0z1x2c', 'Budi Santoso (Admin)', 'admin', true, true),
  ('kasir', '$2y$10$tZzT8m0gL9O0R/j7c2Pq4eeQfG5tOaOcl1c7Z940z6P6sD4G4mD5i', 'Siti Rahma (Kasir 1)', 'cashier', true, true),
  ('kasir2', '$2y$10$tZzT8m0gL9O0R/j7c2Pq4eeQfG5tOaOcl1c7Z940z6P6sD4G4mD5i', 'Ahmad Fauzi (Kasir 2)', 'cashier', true, false)
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.settings (id, store_name, address, phone, receipt_footer, tax_percent, paper_size, currency_symbol)
OVERRIDING SYSTEM VALUE
VALUES (1, 'Toko Berkah Sejahtera', 'Jl. Pemuda No. 45, Kebayoran Baru, Jakarta Selatan', '0812-3456-7890', 'Terima kasih atas kunjungan Anda! Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.', 11.00, '58mm', 'Rp')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, name, slug, description)
OVERRIDING SYSTEM VALUE
VALUES 
  (1, 'Minuman', 'minuman', 'Aneka minuman dingin, kopi botol, teh kemasan, dan air mineral'),
  (2, 'Makanan Ringan', 'snack', 'Snack, biskuit, keripik kentang, dan camilan'),
  (3, 'Sembako & Dapur', 'sembako', 'Beras, minyak goreng kemasan, gula pasir, mie instan'),
  (4, 'Perawatan Diri', 'perawatan', 'Sabun mandi, pasta gigi, sampo, dan deterjen'),
  (5, 'Rokok & Tembakau', 'rokok', 'Rokok filter, kretek, dan korek api gas')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, category_id, code, barcode, name, buy_price, sell_price, stock, min_stock, unit, is_active)
OVERRIDING SYSTEM VALUE
VALUES 
  (1, 1, 'MIN-001', '8991001100012', 'Kopi Susu Gula Aren 250ml', 6500.00, 10000.00, 45, 10, 'botol', true),
  (2, 1, 'MIN-002', '8991002200021', 'Teh Botol Sosro Kotak 250ml', 2800.00, 4500.00, 60, 15, 'kotak', true),
  (3, 1, 'MIN-003', '8991003300035', 'Air Mineral Le Minerale 600ml', 2200.00, 3500.00, 80, 20, 'botol', true),
  (4, 2, 'SNK-001', '8992001100048', 'Chitato Sapi Panggang 68g', 9000.00, 12500.00, 28, 8, 'bungkus', true),
  (5, 2, 'SNK-002', '8992002200059', 'Oreo Vanilla Cream 133g', 7500.00, 10500.00, 22, 10, 'roll', true),
  (6, 2, 'SNK-003', '8992003300062', 'SilverQueen Cashew 58g', 12000.00, 16500.00, 14, 5, 'batang', true),
  (7, 3, 'SMB-001', '8993001100073', 'Indomie Goreng Spesial 85g', 2600.00, 3500.00, 140, 30, 'bungkus', true),
  (8, 3, 'SMB-002', '8993002200084', 'Minyak Goreng Bimoli Refill 1L', 16500.00, 20000.00, 5, 10, 'pouch', true),
  (9, 3, 'SMB-003', '8993003300095', 'Beras Premium Ramos 5kg', 68000.00, 76000.00, 4, 8, 'karung', true),
  (10, 4, 'PRW-001', '8994001100101', 'Sabun Lifebuoy Total 10 110g', 3800.00, 5500.00, 35, 12, 'batang', true),
  (11, 4, 'PRW-002', '8994002200112', 'Pepsodent Pencegah Gigi Berlubang 190g', 9800.00, 13500.00, 18, 6, 'tube', true),
  (12, 5, 'RKK-001', '8995001100123', 'Sampoerna A Mild 16 Batang', 31000.00, 35000.00, 25, 10, 'bungkus', true)
ON CONFLICT (code) DO NOTHING;
`;

  const supabaseClientExample = `// src/lib/supabase.ts
// Menggunakan @supabase/supabase-js di Frontend atau Backend
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOi...';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Contoh: Ambil daftar produk dengan stok menipis
export async function getLowStockProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .lte('stock', supabase.raw('min_stock'))
    .eq('is_active', true);

  if (error) throw error;
  return data;
}

// Contoh: Catat transaksi baru dengan item
export async function saveTransaction(invoiceData, cartItems) {
  // 1. Insert transaction header
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert([invoiceData])
    .select()
    .single();

  if (txError) throw txError;

  // 2. Insert items
  const itemsWithTxId = cartItems.map(item => ({
    ...item,
    transaction_id: tx.id
  }));

  const { error: itemsError } = await supabase
    .from('transaction_items')
    .insert(itemsWithTxId);

  if (itemsError) throw itemsError;

  // 3. Kurangi stok tiap produk
  for (const item of cartItems) {
    await supabase.rpc('decrement_stock', {
      row_id: item.product_id,
      amount: item.quantity
    });
  }

  return tx;
}
`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([supabaseSqlCode], { type: 'application/sql' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'supabase_schema.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500 text-slate-900 flex items-center justify-center font-black text-xs">
              S
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              Supabase PostgreSQL Database & Real-time Integration
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Skema DDL PostgreSQL untuk Supabase SQL Editor, aturan Row Level Security (RLS), Realtime Channels, dan konfigurasi API key.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(activeTab === 'supabase' ? supabaseSqlCode : supabaseClientExample)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin ke Clipboard' : 'Salin Kode'}</span>
          </button>

          <button
            onClick={handleDownloadSql}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Unduh supabase_schema.sql</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('supabase')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'supabase'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Skema SQL Supabase (DDL & RLS)</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'config'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Hubungkan Akun Supabase Anda</span>
        </button>

        <button
          onClick={() => setActiveTab('js_client')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'js_client'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Kode Klien @supabase/supabase-js</span>
        </button>

        <button
          onClick={() => setActiveTab('install')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'install'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Cara Setup di Supabase Cloud (3 Menit)</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'supabase' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-3 bg-slate-800/60 border-b border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <span className="font-mono text-emerald-400">supabase_schema.sql (PostgreSQL 15+)</span>
            <span className="text-[11px] text-slate-400">Siap dieksekusi di SQL Editor Supabase</span>
          </div>
          <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
            <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
              <code>{supabaseSqlCode}</code>
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="max-w-xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Konfigurasi Project Supabase</h3>
              <p className="text-xs text-slate-500">
                Masukkan Project URL & Anon Public Key dari project Supabase Anda untuk integrasi langsung.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                required
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Dapat ditemukan di: <strong>Project Settings → API → Project URL</strong>
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Supabase Anon Public API Key
              </label>
              <textarea
                rows={3}
                required
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Dapat ditemukan di: <strong>Project Settings → API → Project API Keys → `anon public`</strong>
              </p>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Kredensial Supabase tersimpan! Client aktif menggunakan koneksi cloud Supabase.</span>
              </div>
            )}

            {testResult && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                testResult.success 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                {testResult.success ? <Check className="w-4 h-4 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleClearConfig}
                className="text-xs text-red-500 hover:text-red-700 font-semibold"
              >
                Reset Lokal
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isTesting || !supabaseUrl || !supabaseAnonKey}
                  onClick={async () => {
                    setIsTesting(true);
                    setTestResult(null);
                    setCustomSupabaseConfig(supabaseUrl, supabaseAnonKey);
                    const res = await testSupabaseConnection();
                    setTestResult(res);
                    setIsTesting(false);
                  }}
                  className="px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
                >
                  {isTesting ? 'Menguji...' : 'Uji Koneksi'}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
                >
                  Simpan & Hubungkan
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'js_client' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-3 bg-slate-800/60 border-b border-slate-700/60 text-xs text-slate-300 font-mono text-indigo-400">
            Contoh Implementasi Query & Real-Time Supabase
          </div>
          <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
            <pre className="text-xs font-mono text-indigo-300 leading-relaxed">
              <code>{supabaseClientExample}</code>
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'install' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs text-slate-700 leading-relaxed">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
            Langkah-Langkah Membuat Database di Supabase (Gratis & Cepat)
          </h3>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Buat Proyek Baru di Supabase:</span>
              </div>
              <ul className="list-disc list-inside text-slate-600 pl-4 space-y-1">
                <li>Buka <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold hover:underline">supabase.com</a> dan login dengan akun GitHub / Email.</li>
                <li>Klik tombol <strong>"New Project"</strong>.</li>
                <li>Isi nama project: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">pos-kasir-modern</code>.</li>
                <li>Tentukan Database Password dan pilih Region terdekat (misal: <em>Singapore [ap-southeast-1]</em>).</li>
                <li>Tunggu ~1-2 menit hingga database selesai disiapkan.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>Jalankan Skema SQL di SQL Editor:</span>
              </div>
              <ul className="list-disc list-inside text-slate-600 pl-4 space-y-1">
                <li>Masuk ke menu <strong>SQL Editor</strong> di sidebar sebelah kiri Supabase.</li>
                <li>Klik tombol <strong>"New query"</strong>.</li>
                <li>Salin seluruh kode dari tab <strong>"Skema SQL Supabase"</strong> di atas dan tempel ke editor.</li>
                <li>Klik tombol hijau <strong>"RUN"</strong> (atau tekan Ctrl + Enter).</li>
                <li>Seluruh 8 tabel, relasi, RLS policies, dan seeder data awal produk akan langsung dibuat secara otomatis!</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                <span>Salin URL & API Key ke Aplikasi POS:</span>
              </div>
              <ul className="list-disc list-inside text-slate-600 pl-4 space-y-1">
                <li>Buka menu <strong>Project Settings → API</strong> di Supabase.</li>
                <li>Salin <strong>Project URL</strong> dan <strong>anon public API key</strong>.</li>
                <li>Buka tab <strong>"Hubungkan Akun Supabase Anda"</strong> di atas dan klik <em>Simpan & Hubungkan</em>.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
