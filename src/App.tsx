/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Product, 
  Category, 
  Transaction, 
  StockMovement, 
  ActivityLog, 
  StoreSettings 
} from './types';
import { 
  INITIAL_USERS, 
  INITIAL_PRODUCTS, 
  INITIAL_CATEGORIES, 
  INITIAL_SETTINGS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_STOCK_MOVEMENTS, 
  INITIAL_ACTIVITY_LOGS 
} from './data/initialData';

import { Navbar } from './components/Navbar';
import { PosScreen } from './components/PosScreen';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { AdminDashboard } from './components/AdminDashboard';
import { ProductManagement } from './components/ProductManagement';
import { StockManagement } from './components/StockManagement';
import { ReportsView } from './components/ReportsView';
import { UserManagement } from './components/UserManagement';
import { StoreSettingsView } from './components/StoreSettingsView';
import { ActivityLogsView } from './components/ActivityLogsView';
import { SqlAndSourceModal } from './components/SqlAndSourceModal';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { Forbidden403 } from './components/Forbidden403';
import { LoginView } from './components/LoginView';
import { ChangePasswordModal } from './components/ChangePasswordModal';

export default function App() {
  // Persistence state
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('pos_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pos_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Default login as Admin
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pos_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('pos_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('pos_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('pos_stock_movements');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_MOVEMENTS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('pos_activity_logs');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('pos_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [printedTransaction, setPrintedTransaction] = useState<Transaction | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('pos_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('pos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pos_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('pos_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('pos_stock_movements', JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem('pos_activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('pos_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pos_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pos_current_user');
    }
  }, [currentUser]);

  // Helper log activity
  const addLog = (action: ActivityLog['action'], description: string) => {
    const newLog: ActivityLog = {
      id: Date.now(),
      user_id: currentUser?.id || 0,
      user_name: currentUser?.name || 'Sistem',
      action,
      description,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Login handler
  const handleLogin = (username: string, password: string): boolean => {
    const found = users.find((u) => u.username.toLowerCase() === username.toLowerCase().trim());
    if (!found) return false;

    // Check credentials (admin / admin123  or  kasir / kasir123)
    const validPass = 
      (username === 'admin' && password === 'admin123') ||
      (username === 'kasir' && password === 'kasir123') ||
      (username === 'kasir2' && password === 'kasir123') ||
      password === 'admin123' || password === 'kasir123';

    if (!validPass) return false;

    if (!found.is_active) {
      alert('Akun ini telah dinonaktifkan oleh administrator. Hubungi supervisor!');
      return false;
    }

    setCurrentUser(found);
    addLog('login', `User ${found.name} berhasil login sebagai ${found.role}`);
    setActiveTab('pos');
    return true;
  };

  const handleQuickLogin = (username: string) => {
    const found = users.find((u) => u.username === username);
    if (found && found.is_active) {
      setCurrentUser(found);
      addLog('login', `User ${found.name} login via Akses Cepat`);
      setActiveTab('pos');
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      addLog('logout', `User ${currentUser.name} logout dari sistem`);
    }
    setCurrentUser(null);
  };

  const handleSwitchUser = (username: string) => {
    const target = users.find((u) => u.username === username);
    if (target && target.is_active) {
      setCurrentUser(target);
      addLog('login', `Beralih sesi login ke ${target.name} (${target.role})`);
      // If switching to cashier from admin tab, send back to POS
      if (target.role === 'cashier' && !['pos', 'transactions', 'source_code'].includes(activeTab)) {
        setActiveTab('pos');
      }
    }
  };

  // Role Access Guard: Operator accessing admin tabs -> 403
  const handleSelectTab = (tab: string) => {
    const adminOnlyTabs = ['dashboard', 'products', 'stock', 'reports', 'users', 'settings', 'logs'];
    if (currentUser?.role === 'cashier' && adminOnlyTabs.includes(tab)) {
      setActiveTab('forbidden');
      return;
    }
    setActiveTab(tab);
  };

  // Transaction Checkout
  const handleCompleteTransaction = (newTx: Transaction) => {
    // 1. Simpan Transaksi
    setTransactions((prev) => [newTx, ...prev]);

    // 2. Kurangi stok produk secara atomik & catat stock_movements
    const newMovements: StockMovement[] = [];
    setProducts((prevProducts) => {
      return prevProducts.map((p) => {
        const itemBought = newTx.items.find((item) => item.product_id === p.id);
        if (itemBought) {
          const prevStock = p.stock;
          const currStock = p.stock - itemBought.quantity;

          newMovements.push({
            id: Date.now() + Math.random(),
            product_id: p.id,
            product_name: p.name,
            type: 'out',
            quantity: -itemBought.quantity,
            previous_stock: prevStock,
            current_stock: currStock,
            reason: `Penjualan kasir (${newTx.invoice_number})`,
            user_name: currentUser?.name || 'Kasir',
            created_at: new Date().toISOString(),
          });

          return { ...p, stock: currStock };
        }
        return p;
      });
    });

    if (newMovements.length > 0) {
      setStockMovements((prev) => [...newMovements, ...prev]);
    }

    // 3. Catat ke Activity Log
    addLog(
      'transaction',
      `Transaksi baru ${newTx.invoice_number} oleh ${newTx.user_name} (${newTx.payment_method.toUpperCase()}: ${newTx.total_amount})`
    );

    // 4. Langsung buka modal cetak nota thermal
    setPrintedTransaction(newTx);
  };

  // Void Transaction with Admin Password verification
  const handleVoidTransaction = (
    transactionId: number, 
    adminPassword: string, 
    voidReason: string
  ): boolean => {
    if (adminPassword !== 'admin123') {
      return false;
    }

    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx || tx.status === 'void') return false;

    // 1. Update status transaksi jadi void
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              status: 'void',
              void_reason: voidReason,
              void_by: currentUser?.name || 'Administrator',
            }
          : t
      )
    );

    // 2. Kembalikan stok item ke database & catat pergerakan stok
    const voidMovements: StockMovement[] = [];
    setProducts((prevProducts) => {
      return prevProducts.map((p) => {
        const item = tx.items.find((i) => i.product_id === p.id);
        if (item) {
          const prevStock = p.stock;
          const currStock = p.stock + item.quantity;

          voidMovements.push({
            id: Date.now() + Math.random(),
            product_id: p.id,
            product_name: p.name,
            type: 'in',
            quantity: item.quantity,
            previous_stock: prevStock,
            current_stock: currStock,
            reason: `Pengembalian stok dari Void: ${tx.invoice_number} (${voidReason})`,
            user_name: currentUser?.name || 'Admin',
            created_at: new Date().toISOString(),
          });

          return { ...p, stock: currStock };
        }
        return p;
      });
    });

    if (voidMovements.length > 0) {
      setStockMovements((prev) => [...voidMovements, ...prev]);
    }

    addLog('void', `Transaksi ${tx.invoice_number} dibatalkan (Void). Alasan: ${voidReason}`);
    return true;
  };

  // Stock In Handler
  const handleStockIn = (productId: number, qty: number, reason: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const prevStock = prod.stock;
    const currStock = prod.stock + qty;

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: currStock } : p))
    );

    const movement: StockMovement = {
      id: Date.now(),
      product_id: prod.id,
      product_name: prod.name,
      type: 'in',
      quantity: qty,
      previous_stock: prevStock,
      current_stock: currStock,
      reason,
      user_name: currentUser?.name || 'Admin',
      created_at: new Date().toISOString(),
    };

    setStockMovements((prev) => [movement, ...prev]);
    addLog('stock_update', `Stok masuk ${prod.name}: +${qty} ${prod.unit} (${reason})`);
  };

  // Stock Adjustment Handler
  const handleStockAdjustment = (productId: number, actualQty: number, reason: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const prevStock = prod.stock;
    const diff = actualQty - prevStock;

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: actualQty } : p))
    );

    const movement: StockMovement = {
      id: Date.now(),
      product_id: prod.id,
      product_name: prod.name,
      type: 'adjustment',
      quantity: diff,
      previous_stock: prevStock,
      current_stock: actualQty,
      reason,
      user_name: currentUser?.name || 'Admin',
      created_at: new Date().toISOString(),
    };

    setStockMovements((prev) => [movement, ...prev]);
    addLog('stock_update', `Penyesuaian stok ${prod.name}: ${prevStock} → ${actualQty} ${prod.unit} (${reason})`);
  };

  // Product CRUD Handlers
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const product: Product = {
      ...newProd,
      id: Date.now(),
    };
    setProducts((prev) => [product, ...prev]);
    addLog('product_crud', `Menambahkan produk baru: ${product.name} (${product.code})`);
  };

  const handleUpdateProduct = (id: number, data: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
    addLog('product_crud', `Memperbarui data produk ID #${id}`);
  };

  const handleDeleteProduct = (id: number) => {
    const prod = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (prod) {
      addLog('product_crud', `Menghapus produk: ${prod.name}`);
    }
  };

  // Category CRUD
  const handleAddCategory = (newCat: Omit<Category, 'id'>) => {
    const cat: Category = { ...newCat, id: Date.now() };
    setCategories((prev) => [...prev, cat]);
    addLog('product_crud', `Menambahkan kategori baru: ${cat.name}`);
  };

  const handleDeleteCategory = (id: number) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    addLog('product_crud', `Menghapus kategori ID #${id}`);
  };

  // User CRUD Handlers
  const handleAddUser = (newUserData: Omit<User, 'id' | 'created_at'>) => {
    const newUser: User = {
      ...newUserData,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    addLog('user_crud', `Menambahkan pengguna baru: ${newUser.name} (@${newUser.username})`);
  };

  const handleUpdateUser = (id: number, data: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...data } : u))
    );
    addLog('user_crud', `Memperbarui status/data pengguna ID #${id}`);
  };

  const handleDeleteUser = (id: number) => {
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (target) {
      addLog('user_crud', `Menghapus pengguna: ${target.name} (@${target.username})`);
    }
  };

  const handleResetPassword = (id: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, must_change_password: true } : u))
    );
    addLog('user_crud', `Mereset password pengguna ID #${id}`);
  };

  const handleSelfUpdatePassword = () => {
    if (!currentUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id ? { ...u, must_change_password: false } : u
      )
    );
    setCurrentUser((prev) => prev ? { ...prev, must_change_password: false } : null);
    addLog('user_crud', `Pengguna ${currentUser.name} telah memperbarui kata sandinya`);
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return (
      <LoginView
        settings={settings}
        onLogin={handleLogin}
        onQuickLogin={handleQuickLogin}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        settings={settings}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        allUsers={users}
        onChangePasswordClick={() => setIsChangePasswordOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {activeTab === 'pos' && (
          <PosScreen
            products={products}
            categories={categories}
            currentUser={currentUser}
            settings={settings}
            onCompleteTransaction={handleCompleteTransaction}
            nextInvoiceSequence={transactions.length + 1}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionHistoryView
            transactions={transactions}
            currentUser={currentUser}
            settings={settings}
            onReprintReceipt={(tx) => setPrintedTransaction(tx)}
            onVoidTransaction={handleVoidTransaction}
          />
        )}

        {activeTab === 'dashboard' && (
          <AdminDashboard
            transactions={transactions}
            products={products}
            categories={categories}
            settings={settings}
            onNavigate={handleSelectTab}
          />
        )}

        {activeTab === 'products' && (
          <ProductManagement
            products={products}
            categories={categories}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'stock' && (
          <StockManagement
            products={products}
            stockMovements={stockMovements}
            currentUser={currentUser}
            onStockIn={handleStockIn}
            onStockAdjustment={handleStockAdjustment}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            transactions={transactions}
            products={products}
            categories={categories}
            users={users}
            settings={settings}
          />
        )}

        {activeTab === 'users' && (
          <UserManagement
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onResetPassword={handleResetPassword}
          />
        )}

        {activeTab === 'settings' && (
          <StoreSettingsView
            settings={settings}
            onUpdateSettings={(newSettings) => {
              setSettings(newSettings);
              addLog('settings_update', 'Memperbarui profil dan pengaturan toko');
            }}
          />
        )}

        {activeTab === 'source_code' && <SqlAndSourceModal />}

        {activeTab === 'forbidden' && (
          <Forbidden403
            onBackToPos={() => setActiveTab('pos')}
            onSwitchToAdmin={() => handleSwitchUser('admin')}
          />
        )}
      </main>

      {/* Thermal Receipt Print Modal */}
      {printedTransaction && (
        <ThermalReceiptModal
          transaction={printedTransaction}
          settings={settings}
          onClose={() => setPrintedTransaction(null)}
        />
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <ChangePasswordModal
          currentUser={currentUser}
          onClose={() => setIsChangePasswordOpen(false)}
          onUpdatePassword={handleSelfUpdatePassword}
        />
      )}
    </div>
  );
}
