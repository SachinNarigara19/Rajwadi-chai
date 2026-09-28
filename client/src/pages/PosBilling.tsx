import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  User,
  Users,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  Camera,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, Category, Customer, Sale, BusinessSettings } from '../types';
import { api, ApiError } from '../api/client';
import { InvoiceModal } from '../components/InvoiceModal';
import { AgeVerificationModal } from '../components/AgeVerificationModal';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  totalPrice: number;
}

export const PosBilling: React.FC = () => {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'SPLIT'>('CASH');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  // Modals
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');

  // Status
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ageVerificationPassed, setAgeVerificationPassed] = useState(false);
  const [verifierNotes, setVerifierNotes] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // Load initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [catsRes, prodsRes, custsRes, settRes] = await Promise.all([
        api.get<{ success: boolean; categories: Category[] }>('/categories'),
        api.get<{ success: boolean; products: Product[] }>('/products'),
        api.get<{ success: boolean; customers: Customer[] }>('/customers'),
        api.get<{ success: boolean; settings: BusinessSettings }>('/settings'),
      ]);

      if (catsRes.success) setCategories(catsRes.categories);
      if (prodsRes.success) {
        setProducts(prodsRes.products);
        setFilteredProducts(prodsRes.products);
      }
      if (custsRes.success) setCustomers(custsRes.customers);
      if (settRes.success) setSettings(settRes.settings);
    } catch (err) {
      console.error('Failed to load POS billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products by category & search
  useEffect(() => {
    let result = products;
    if (selectedCategory !== 'ALL') {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }
    setFilteredProducts(result);
  }, [selectedCategory, searchQuery, products]);

  // Barcode Scanning Handler (Requirement 14)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const code = barcodeInput.trim();
    const matched = products.find(
      (p) => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      setErrorMessage(`Barcode/SKU "${code}" not found in product database.`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.currentStock <= 0 && !settings?.allowNegativeStock) {
      setErrorMessage(`"${product.name}" is currently out of stock.`);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (!settings?.allowNegativeStock && newQty > product.currentStock) {
          setErrorMessage(`Only ${product.currentStock} units available for "${product.name}".`);
          setTimeout(() => setErrorMessage(null), 3000);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQty,
                totalPrice: (newQty * item.unitPrice) - item.discount + item.tax,
              }
            : item
        );
      }

      // Calculate line tax (if GST applied)
      const taxRate = product.taxRate || 0;
      const unitTax = (product.sellingPrice * taxRate) / 100;
      const newItem: CartItem = {
        product,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discount: 0,
        tax: Math.round(unitTax * 100) / 100,
        totalPrice: Math.round((product.sellingPrice + unitTax) * 100) / 100,
      };
      return [...prev, newItem];
    });

    // Reset age check if adding an age-restricted item
    if (product.isAgeRestricted) {
      setAgeVerificationPassed(false);
    }
  };

  // Update item quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (!settings?.allowNegativeStock && newQty > item.product.currentStock) {
              setErrorMessage(`Cannot exceed current stock (${item.product.currentStock}).`);
              setTimeout(() => setErrorMessage(null), 3000);
              return item;
            }
            const unitTax = (item.unitPrice * (item.product.taxRate || 0)) / 100;
            const lineTax = Math.round(unitTax * newQty * 100) / 100;
            return {
              ...item,
              quantity: newQty,
              tax: lineTax,
              totalPrice: (newQty * item.unitPrice) - item.discount + lineTax,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setOverallDiscount(0);
    setPaidAmount('');
    setAgeVerificationPassed(false);
    setVerifierNotes('');
    setNotes('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalTax = cart.reduce((sum, item) => sum + item.tax, 0);
  const grandTotal = Math.max(0, subtotal - overallDiscount + totalTax);

  // Check if age-restricted products are in cart
  const hasAgeRestrictedItems = cart.some((item) => item.product.isAgeRestricted);

  // Create new customer quick action
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    try {
      const res = await api.post<{ success: boolean; customer: Customer }>('/customers', {
        name: newCustName.trim(),
        mobile: newCustMobile.trim() || null,
      });

      if (res.success && res.customer) {
        setCustomers((prev) => [res.customer, ...prev]);
        setSelectedCustomer(res.customer);
        setIsNewCustomerModalOpen(false);
        setNewCustName('');
        setNewCustMobile('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create customer');
    }
  };

  // Checkout submission
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMessage('Your cart is empty. Add products to generate a bill.');
      return;
    }

    // Age restriction check (Requirement 11)
    if (hasAgeRestrictedItems && !ageVerificationPassed && settings?.enableAgeVerification) {
      setIsAgeModalOpen(true);
      return;
    }

    setCheckingOut(true);
    setErrorMessage(null);

    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
      }));

      const finalPaid = paidAmount ? parseFloat(paidAmount) : (paymentMethod === 'CREDIT' ? 0 : grandTotal);

      const res = await api.post<{ success: boolean; sale: Sale; message: string }>('/sales', {
        customerId: selectedCustomer ? selectedCustomer.id : null,
        items: itemsPayload,
        discount: overallDiscount,
        tax: totalTax,
        paymentMethod,
        paidAmount: finalPaid,
        ageVerified: ageVerificationPassed,
        verifierNotes: verifierNotes || null,
        notes: notes.trim() || null,
      });

      if (res.success && res.sale) {
        // Confetti effect!
        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#d97706', '#f59e0b', '#10b981'],
          });
        } catch (_) {}

        setCompletedSale(res.sale);
        setIsInvoiceModalOpen(true);

        // Update local product stocks
        setProducts((prev) =>
          prev.map((p) => {
            const soldItem = cart.find((c) => c.product.id === p.id);
            if (soldItem) {
              return { ...p, currentStock: p.currentStock - soldItem.quantity };
            }
            return p;
          })
        );

        clearCart();
      }
    } catch (err: any) {
      if (err.data?.requiresAgeVerification) {
        setIsAgeModalOpen(true);
      } else {
        setErrorMessage(err.message || 'Invoice checkout failed.');
      }
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-4">
      {/* LEFT & CENTER: Products & Categories Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Top Controls: Search + Barcode + Category Bar */}
        <div className="p-4 border-b border-stone-200 space-y-3 bg-stone-50/70">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Rajwadi Tea, snacks, drinks... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Barcode Scanner Input (Requirement 14) */}
            <form onSubmit={handleBarcodeSubmit} className="relative sm:w-64">
              <Barcode className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan / Type Barcode + Enter"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 placeholder:text-stone-400"
              />
            </form>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center space-x-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span>{cat.name}</span>
                {cat._count?.products !== undefined && (
                  <span className="text-[10px] opacity-75 font-mono">({cat._count.products})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Products Grid (Requirement 9) */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center p-8 text-stone-400">
              <div>
                <p className="text-3xl mb-2">🍵</p>
                <p className="text-sm font-semibold">No products found</p>
                <p className="text-xs text-stone-500 mt-1">Try switching categories or changing your search terms.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {filteredProducts.map((p) => {
                const isOut = p.currentStock <= 0;
                const isLow = p.currentStock > 0 && p.currentStock <= p.minStockLevel;

                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`group relative rounded-2xl border bg-white p-3 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 select-none ${
                      isOut
                        ? 'border-stone-200 opacity-60'
                        : isLow
                        ? 'border-amber-300 hover:border-amber-500'
                        : 'border-stone-200 hover:border-amber-400'
                    }`}
                  >
                    {/* Product Image */}
                    <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-stone-100 mb-2">
                      <img
                        src={p.imageUrl || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80'}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />

                      {/* Age-restricted badge */}
                      {p.isAgeRestricted && (
                        <span className="absolute top-1.5 left-1.5 bg-rose-600/95 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-xs">
                          18+
                        </span>
                      )}

                      {/* Stock Pill */}
                      <span
                        className={`absolute top-1.5 right-1.5 font-bold text-[9px] px-1.5 py-0.5 rounded-md shadow-xs ${
                          isOut
                            ? 'bg-rose-600 text-white'
                            : isLow
                            ? 'bg-amber-500 text-stone-950 font-black'
                            : 'bg-stone-900/80 text-white'
                        }`}
                      >
                        {isOut ? 'Out of Stock' : `${p.currentStock} ${p.unit}`}
                      </span>
                    </div>

                    {/* Product Details */}
                    <div>
                      <p className="text-[11px] font-bold text-stone-900 leading-snug line-clamp-2">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-stone-500 mt-0.5">{p.brand || 'Jay Mataji'}</p>
                    </div>

                    {/* Price and Add Action */}
                    <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-sm font-black text-amber-700 font-mono">
                        ₹{p.sellingPrice}
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-amber-500 group-hover:bg-amber-600 text-stone-950 flex items-center justify-center transition shadow-xs">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Current Bill / Cart (Requirement 9 & 10) */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden shrink-0">
        {/* Cart Header */}
        <div className="p-4 bg-stone-900 text-white border-b border-amber-600/30 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-400">Current Bill</h2>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
              {cart.reduce((s, i) => s + i.quantity, 0)} Items
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] text-stone-400 hover:text-rose-400 flex items-center transition"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
            </button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-2">
          <div className="flex-1">
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const found = customers.find((c) => c.id === e.target.value);
                setSelectedCustomer(found || null);
              }}
              className="w-full text-xs py-1.5 px-2 bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-500"
            >
              <option value="">👤 Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.mobile ? `(${c.mobile})` : ''} {c.currentBalance > 0 ? `[Khata: ₹${c.currentBalance}]` : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsNewCustomerModalOpen(true)}
            className="p-1.5 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 transition text-xs font-bold"
            title="Add New Customer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-stone-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <ShoppingCart className="w-12 h-12 text-stone-200 mb-2 stroke-[1.5]" />
              <p className="text-xs font-bold text-stone-500">Cart is empty</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Click product cards or scan barcode to add items</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <p className="text-xs font-bold text-stone-900 truncate">{item.product.name}</p>
                    {item.product.isAgeRestricted && (
                      <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1 rounded border border-rose-200">
                        18+
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-500 font-mono">
                    ₹{item.unitPrice} × {item.quantity} = ₹{item.totalPrice}
                  </p>
                </div>

                {/* Stepper (+ / -) */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold font-mono text-stone-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-stone-300 hover:text-rose-500 transition ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Age Restriction Alert in Cart */}
        {hasAgeRestrictedItems && (
          <div className="px-3 py-2 bg-rose-50 border-t border-rose-200 text-[11px] flex items-center justify-between text-rose-800">
            <span className="font-bold flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-rose-600" />
              {ageVerificationPassed ? 'Age Verified (18+)' : 'Age Verification Required'}
            </span>
            {!ageVerificationPassed && (
              <button
                onClick={() => setIsAgeModalOpen(true)}
                className="text-[10px] font-bold text-rose-700 underline"
              >
                Verify Now
              </button>
            )}
          </div>
        )}

        {/* Billing Calculations & Payment Options */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3">
          {/* Subtotal & Discount */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal:</span>
              <span className="font-mono">₹{subtotal.toFixed(2)}</span>
            </div>
            {totalTax > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Tax (GST):</span>
                <span className="font-mono">+₹{totalTax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-stone-600 pt-0.5">
              <span>Discount (₹):</span>
              <input
                type="number"
                min="0"
                value={overallDiscount || ''}
                onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-20 text-right text-xs py-0.5 px-1.5 bg-white border border-stone-300 rounded-md font-mono"
              />
            </div>
            <div className="flex justify-between text-base font-black text-stone-900 pt-1 border-t border-stone-200">
              <span>Grand Total:</span>
              <span className="font-mono text-amber-700">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector (Requirement 10) */}
          <div>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              Payment Method
            </p>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-1.5 px-2 rounded-xl border flex flex-col items-center justify-center transition ${
                  paymentMethod === 'CASH'
                    ? 'border-amber-600 bg-amber-600 text-white font-bold shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Banknote className="w-3.5 h-3.5 mb-0.5" />
                <span className="text-[10px]">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`py-1.5 px-2 rounded-xl border flex flex-col items-center justify-center transition ${
                  paymentMethod === 'UPI'
                    ? 'border-amber-600 bg-amber-600 text-white font-bold shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 mb-0.5" />
                <span className="text-[10px]">UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`py-1.5 px-2 rounded-xl border flex flex-col items-center justify-center transition ${
                  paymentMethod === 'CARD'
                    ? 'border-amber-600 bg-amber-600 text-white font-bold shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 mb-0.5" />
                <span className="text-[10px]">Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CREDIT')}
                className={`py-1.5 px-2 rounded-xl border flex flex-col items-center justify-center transition ${
                  paymentMethod === 'CREDIT'
                    ? 'border-amber-600 bg-amber-600 text-white font-bold shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Users className="w-3.5 h-3.5 mb-0.5" />
                <span className="text-[10px]">Khata</span>
              </button>
            </div>
          </div>

          {/* Cash Tendered / Change Input if Cash */}
          {paymentMethod === 'CASH' && (
            <div className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-stone-200">
              <span className="text-stone-500 font-medium">Cash Given:</span>
              <input
                type="number"
                placeholder={`₹${grandTotal}`}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-24 text-right text-xs py-1 px-2 border border-stone-300 rounded-lg font-mono font-bold"
              />
              {parseFloat(paidAmount) > grandTotal && (
                <span className="text-[11px] font-bold text-emerald-600 font-mono">
                  Change: ₹{(parseFloat(paidAmount) - grandTotal).toFixed(2)}
                </span>
              )}
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkingOut}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-stone-950 font-black text-xs py-3 rounded-xl shadow-md shadow-amber-500/25 transition flex items-center justify-center space-x-2 active:scale-98"
          >
            <span>{checkingOut ? 'Generating Invoice...' : `Complete Sale • ₹${grandTotal.toFixed(2)}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Age Verification Modal */}
      <AgeVerificationModal
        isOpen={isAgeModalOpen}
        onClose={() => setIsAgeModalOpen(false)}
        onConfirm={(note) => {
          setAgeVerificationPassed(true);
          setVerifierNotes(note);
          setIsAgeModalOpen(false);
          // Re-trigger checkout directly
          setTimeout(() => handleCheckout(), 100);
        }}
        minAge={settings?.minAgeForRestricted || 18}
      />

      {/* Invoice & Thermal Receipt Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        sale={completedSale}
        settings={settings}
      />

      {/* Quick Add Customer Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">Add New Customer</h3>
              <button onClick={() => setIsNewCustomerModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9898012345"
                  value={newCustMobile}
                  onChange={(e) => setNewCustMobile(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
