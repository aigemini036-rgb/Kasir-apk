import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Product, Category, CartItem, User, StoreSettings, PaymentMethod, Transaction } from '../types';
import { formatRupiah, generateInvoiceNumber } from '../utils/helpers';
import { 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Receipt, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';

interface PosScreenProps {
  products: Product[];
  categories: Category[];
  currentUser: User;
  settings: StoreSettings;
  onCompleteTransaction: (transaction: Transaction) => void;
  nextInvoiceSequence: number;
}

export const PosScreen: React.FC<PosScreenProps> = ({
  products,
  categories,
  currentUser,
  settings,
  onCompleteTransaction,
  nextInvoiceSequence,
}) => {
  // State
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  
  // Discount & Tax
  const [globalDiscountType, setGlobalDiscountType] = useState<'nominal' | 'percent'>('nominal');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(true);

  // Payment Drawer / Modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [cardReference, setCardReference] = useState<string>('');
  const [transactionSuccess, setTransactionSuccess] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto focus search / barcode scanner on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.is_active) return false;
      const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.barcode.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Barcode / Fast Input Handler (Enter key)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Find exact barcode match or exact code match
    const found = products.find(
      (p) => p.is_active && (p.barcode === searchQuery.trim() || p.code.toLowerCase() === searchQuery.toLowerCase().trim())
    );

    if (found) {
      addToCart(found);
      setSearchQuery('');
    } else if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0]);
      setSearchQuery('');
    }
  };

  // Cart Management
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Stok produk "${product.name}" habis!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Jumlah di keranjang sudah mencapai batas stok (${product.stock} ${product.unit}).`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.product.sell_price - item.discount_amount,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            discount_percent: 0,
            discount_amount: 0,
            subtotal: product.sell_price,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              alert(`Maksimal stok tersedia adalah ${item.product.stock} ${item.product.unit}`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.product.sell_price - item.discount_amount,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm('Kosongkan keranjang belanja?')) {
      setCart([]);
    }
  };

  // Financial Calculations
  const rawSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity * item.product.sell_price, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (globalDiscountType === 'percent') {
      return Math.round((rawSubtotal * Math.min(100, Math.max(0, globalDiscountValue))) / 100);
    }
    return Math.min(rawSubtotal, Math.max(0, globalDiscountValue));
  }, [rawSubtotal, globalDiscountType, globalDiscountValue]);

  const afterDiscountSubtotal = Math.max(0, rawSubtotal - discountAmount);

  const taxAmount = useMemo(() => {
    if (!applyTax) return 0;
    return Math.round((afterDiscountSubtotal * settings.tax_percent) / 100);
  }, [applyTax, afterDiscountSubtotal, settings.tax_percent]);

  const grandTotal = afterDiscountSubtotal + taxAmount;

  // Open payment drawer
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashReceived(grandTotal); // default cash to exact amount
    setIsPaymentOpen(true);
  };

  // Change calculation
  const changeAmount = Math.max(0, cashReceived - grandTotal);
  const isCashSufficient = paymentMethod === 'tunai' ? cashReceived >= grandTotal : true;

  // Fast cash buttons
  const cashOptions = useMemo(() => {
    const list = [grandTotal];
    const roundTo10k = Math.ceil(grandTotal / 10000) * 10000;
    const roundTo20k = Math.ceil(grandTotal / 20000) * 20000;
    const roundTo50k = Math.ceil(grandTotal / 50000) * 50000;
    const roundTo100k = Math.ceil(grandTotal / 100000) * 100000;
    
    [roundTo10k, roundTo20k, roundTo50k, roundTo100k].forEach((val) => {
      if (val >= grandTotal && !list.includes(val)) {
        list.push(val);
      }
    });
    return list.sort((a, b) => a - b).slice(0, 5);
  }, [grandTotal]);

  // Complete Payment Process
  const handleProcessPayment = () => {
    if (!isCashSufficient) {
      alert('Uang yang diterima kurang dari total belanja!');
      return;
    }

    const invoiceNumber = generateInvoiceNumber(nextInvoiceSequence);

    const transaction: Transaction = {
      id: Date.now(),
      invoice_number: invoiceNumber,
      user_id: currentUser.id,
      user_name: currentUser.name,
      customer_name: customerName.trim() || 'Pelanggan Umum',
      subtotal: rawSubtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      tax_percent: applyTax ? settings.tax_percent : 0,
      total_amount: grandTotal,
      payment_method: paymentMethod,
      cash_received: paymentMethod === 'tunai' ? cashReceived : grandTotal,
      change_amount: paymentMethod === 'tunai' ? changeAmount : 0,
      status: 'completed',
      created_at: new Date().toISOString(),
      items: cart.map((item, idx) => ({
        id: Date.now() + idx,
        transaction_id: Date.now(),
        product_id: item.product.id,
        product_name: item.product.name,
        product_code: item.product.code,
        buy_price: item.product.buy_price,
        sell_price: item.product.sell_price,
        quantity: item.quantity,
        subtotal: item.quantity * item.product.sell_price,
        profit: (item.product.sell_price - item.product.buy_price) * item.quantity,
      })),
    };

    onCompleteTransaction(transaction);
    setTransactionSuccess(true);

    setTimeout(() => {
      setCart([]);
      setGlobalDiscountValue(0);
      setIsPaymentOpen(false);
      setTransactionSuccess(false);
      setCustomerName('Pelanggan Umum');
      searchInputRef.current?.focus();
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-62px)] bg-slate-100 overflow-hidden">
      {/* LEFT SECTION: Products & Search & Category Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-200">
        {/* Search & Barcode Bar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center">
          <form onSubmit={handleBarcodeSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk (Nama, Kode, atau Scan Barcode [Enter])..."
              className="w-full pl-9 pr-10 py-2 text-xs md:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <Barcode className="w-4 h-4" />
              <span className="hidden sm:inline">Scan</span>
            </div>
          </form>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({products.filter((p) => p.is_active).length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.is_active && p.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-3.5 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center">
              <AlertCircle className="w-10 h-10 mb-2 stroke-1" />
              <p className="font-semibold text-slate-600 text-sm">Produk tidak ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau pilih kategori berbeda</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                const isLowStock = product.stock <= product.min_stock;
                const isOutOfStock = product.stock <= 0;

                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    disabled={isOutOfStock}
                    className={`group text-left p-3 rounded-xl border transition-all flex flex-col justify-between relative bg-white ${
                      isOutOfStock
                        ? 'opacity-60 cursor-not-allowed border-slate-200 bg-slate-50'
                        : 'hover:shadow-md hover:border-indigo-400 active:scale-[0.98] border-slate-200/90'
                    }`}
                  >
                    {/* Low stock tag */}
                    {isLowStock && !isOutOfStock && (
                      <span className="absolute top-2 right-2 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        Sisa {product.stock}
                      </span>
                    )}

                    {isOutOfStock && (
                      <span className="absolute top-2 right-2 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                        Habis
                      </span>
                    )}

                    {inCart && (
                      <span className="absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-xs">
                        {inCart.quantity}
                      </span>
                    )}

                    <div className="pt-2">
                      <p className="text-[10px] text-slate-400 font-mono">{product.code}</p>
                      <h4 className="text-xs md:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm font-bold text-slate-900 font-mono-numbers">
                          {formatRupiah(product.sell_price)}
                        </p>
                        <p className="text-[10px] text-slate-400">/{product.unit}</p>
                      </div>

                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart & Order Breakdown */}
      <div className="w-full lg:w-[420px] xl:w-[460px] bg-white flex flex-col h-[50vh] lg:h-full shadow-lg border-t lg:border-t-0 lg:border-l border-slate-200">
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm">Keranjang Transaksi</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} item
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] text-slate-400">Pelanggan:</span>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Pelanggan Umum"
                className="text-xs font-medium text-slate-700 bg-transparent border-b border-dashed border-slate-300 focus:outline-hidden focus:border-indigo-500 px-1 py-0.5 w-36"
              />
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <Receipt className="w-12 h-12 stroke-1 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700 text-sm">Keranjang Masih Kosong</p>
              <p className="text-xs text-slate-400 mt-1">
                Pilih produk dari daftar di sebelah kiri atau gunakan barcode scanner untuk menambahkan item.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-2.5 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white transition-all flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-semibold text-slate-800 truncate">{item.product.name}</h5>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                    <span className="font-mono-numbers">{formatRupiah(item.product.sell_price)}</span>
                    <span>·</span>
                    <span className="font-bold text-slate-700 font-mono-numbers">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                </div>

                {/* Qty increment / decrement controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center font-bold text-xs font-mono-numbers text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation Summary & Payment Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          {/* Quick Discount & Tax row */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Discount selector */}
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200">
              <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="number"
                min="0"
                value={globalDiscountValue || ''}
                onChange={(e) => setGlobalDiscountValue(Number(e.target.value) || 0)}
                placeholder="Diskon"
                className="w-full text-xs font-mono-numbers bg-transparent focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setGlobalDiscountType(globalDiscountType === 'nominal' ? 'percent' : 'nominal')}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 shrink-0"
              >
                {globalDiscountType === 'nominal' ? 'Rp' : '%'}
              </button>
            </div>

            {/* Tax toggle */}
            <label className="flex items-center justify-between px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 cursor-pointer select-none">
              <span className="text-[11px] text-slate-600 font-medium">PPN {settings.tax_percent}%</span>
              <input
                type="checkbox"
                checked={applyTax}
                onChange={(e) => setApplyTax(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-200 pt-2 font-mono-numbers">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatRupiah(rawSubtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Diskon:</span>
                <span>-{formatRupiah(discountAmount)}</span>
              </div>
            )}
            {applyTax && (
              <div className="flex justify-between text-slate-500">
                <span>PPN ({settings.tax_percent}%):</span>
                <span>{formatRupiah(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 text-slate-900 font-bold">
              <span className="text-sm">TOTAL BAYAR:</span>
              <span className="text-xl text-indigo-600 font-mono-numbers">{formatRupiah(grandTotal)}</span>
            </div>
          </div>

          {/* Bayar CTA */}
          <button
            onClick={handleOpenPayment}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
              cart.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.99] cursor-pointer shadow-indigo-200'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>Bayar Sekarang (F4)</span>
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL DRAWER */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Pembayaran Kasir</h3>
                <p className="text-xs text-slate-300">Invoice: {generateInvoiceNumber(nextInvoiceSequence)}</p>
              </div>
              <button
                onClick={() => setIsPaymentOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Grand Total Display */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Total Tagihan</span>
                <h2 className="text-3xl font-extrabold text-indigo-600 font-mono-numbers mt-0.5">
                  {formatRupiah(grandTotal)}
                </h2>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('tunai');
                      setCashReceived(grandTotal);
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'tunai'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Tunai (Cash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('qris');
                      setCashReceived(grandTotal);
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'qris'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span>QRIS / E-Wallet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('debit');
                      setCashReceived(grandTotal);
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'debit'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Kartu Debit</span>
                  </button>
                </div>
              </div>

              {/* Method-Specific Input */}
              {paymentMethod === 'tunai' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Uang Diterima dari Pelanggan (Rp)
                    </label>
                    <input
                      type="number"
                      autoFocus
                      value={cashReceived || ''}
                      onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full text-xl font-bold font-mono-numbers px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Fast Cash Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {cashOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setCashReceived(opt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono-numbers transition-colors ${
                          cashReceived === opt
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {opt === grandTotal ? 'Uang Pas' : formatRupiah(opt)}
                      </button>
                    ))}
                  </div>

                  {/* Kembalian box */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-800">Kembalian:</span>
                    <span className="text-lg font-bold text-emerald-700 font-mono-numbers">
                      {formatRupiah(changeAmount)}
                    </span>
                  </div>

                  {!isCashSufficient && (
                    <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Uang tunai masih kurang {formatRupiah(grandTotal - cashReceived)}
                    </p>
                  )}
                </div>
              ) : paymentMethod === 'qris' ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-slate-300 shadow-xs flex items-center justify-center">
                    <QrCode className="w-28 h-28 text-slate-800" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Scan QRIS Nasional (ShopeePay, GoPay, OVO, Dana, BCA)</p>
                  <p className="text-[11px] text-slate-500">Minta pelanggan scan kode QR di atas sebesar {formatRupiah(grandTotal)}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Nomor Approval / Referensi Kartu (Opsional)
                    </label>
                    <input
                      type="text"
                      value={cardReference}
                      onChange={(e) => setCardReference(e.target.value)}
                      placeholder="Contoh: REF-889102"
                      className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Gesek atau tap kartu di mesin EDC dan pastikan transaksi berhasil.</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={!isCashSufficient}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                  !isCashSufficient
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-[0.99]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi Bayar & Cetak Nota</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
