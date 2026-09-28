export type UserRole = 'ADMIN' | 'CASHIER' | 'INVENTORY_MANAGER';

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  role: UserRole;
  isActive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  _count?: {
    products: number;
  };
}

export interface Supplier {
  id: string;
  name: string;
  company?: string | null;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
  gstNumber?: string | null;
  openingBalance: number;
  currentBalance: number;
  createdAt?: string;
  purchases?: any[];
  ledger?: any[];
  payments?: any[];
}

export interface Customer {
  id: string;
  name: string;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
  openingBalance: number;
  currentBalance: number;
  totalPurchases: number;
  lastPurchase?: string | null;
  createdAt?: string;
  sales?: any[];
  ledger?: any[];
  payments?: any[];
}

export interface Product {
  id: string;
  name: string;
  imageUrl?: string | null;
  categoryId: string;
  category?: Category;
  subcategory?: string | null;
  brand?: string | null;
  sku: string;
  barcode?: string | null;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  openingStock: number;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number | null;
  taxRate: number;
  supplierId?: string | null;
  supplier?: Supplier;
  isAgeRestricted: boolean;
  complianceNotes?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  totalStockValue?: number;
  unitsSold?: number;
  unitsPurchased?: number;
}

export interface StockTransaction {
  id: string;
  productId: string;
  date: string;
  type: string;
  quantity: number;
  rate: number;
  reference?: string | null;
  balanceAfter: number;
  notes?: string | null;
  createdById?: string | null;
  createdBy?: {
    name: string;
    username: string;
  };
}

export interface SaleItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  purchasePrice?: number;
  discount: number;
  tax: number;
  totalPrice: number;
  product?: {
    sku: string;
    unit: string;
    isAgeRestricted: boolean;
  };
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  customer?: Customer;
  cashierId?: string | null;
  cashier?: {
    id: string;
    name: string;
    username: string;
  };
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  paymentDetails?: string | null;
  paymentStatus: string;
  ageVerified: boolean;
  verifierNotes?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  items: SaleItem[];
  saleReturns?: any[];
}

export interface PurchaseItem {
  id?: string;
  productId: string;
  quantity: number;
  purchaseRate: number;
  tax: number;
  totalPrice: number;
  product?: {
    name: string;
    sku: string;
    unit: string;
  };
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplier: Supplier;
  supplierBillNo?: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  notes?: string | null;
  createdAt: string;
  items: PurchaseItem[];
  purchaseReturns?: any[];
  receivedBy?: {
    id: string;
    name: string;
  };
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    expenses: number;
  };
}

export interface Expense {
  id: string;
  title: string;
  categoryId: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: string;
  date: string;
  notes?: string | null;
  receiptUrl?: string | null;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface BusinessSettings {
  id: string;
  shopName: string;
  tagline?: string | null;
  address: string;
  phone: string;
  email?: string | null;
  gstNumber?: string | null;
  invoicePrefix: string;
  startInvoiceNumber: number;
  defaultTaxRate: number;
  defaultReceiptWidth: string;
  allowNegativeStock: boolean;
  lowStockThreshold: number;
  minAgeForRestricted: number;
  enableAgeVerification: boolean;
  currencySymbol: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: User;
}

export interface ProductAnalyticsMilestone {
  date: string;
  formattedDate: string;
  quantity: number;
  revenue: number;
  dayOfWeek: string;
}

export interface ProductAnalyticsTimelinePoint {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  salesCount: number;
  tag: 'HIGH_SELL' | 'AVERAGE_SELL' | 'LOW_SELL' | 'ZERO_SELL';
}

export interface DayOfWeekPatternPoint {
  day: string;
  shortDay: string;
  averageQty: number;
  totalQty: number;
  totalRevenue: number;
  isPeak: boolean;
  isSlow: boolean;
}

export interface HourlyDistributionPoint {
  hour: number;
  hourLabel: string;
  quantity: number;
  revenue: number;
}

export interface ProductAnalytics {
  product: {
    id: string;
    name: string;
    sku: string;
    barcode?: string | null;
    unit: string;
    imageUrl?: string | null;
    category: string;
    sellingPrice: number;
    purchasePrice: number;
    currentStock: number;
    minStockLevel: number;
  };
  period: string;
  dateRange: {
    start: string;
    end: string;
    daysCount: number;
  };
  metrics: {
    totalUnitsSold: number;
    totalRevenue: number;
    totalCogs: number;
    grossProfit: number;
    profitMargin: number;
    averageDailyUnits: number;
    averageDailyRevenue: number;
    highSellThreshold: number;
    lowSellThreshold: number;
    highSellDaysCount: number;
    lowSellDaysCount: number;
    activeSalesDaysCount: number;
    zeroSalesDaysCount: number;
    runwayDays: number;
    runwayStatus: string;
    velocity: {
      rating: 'HOT_SELLER' | 'HIGH_VOLUME' | 'STEADY_SELLER' | 'SLOW_MOVER' | 'DEAD_STOCK';
      label: string;
      description: string;
      color: string;
    };
  };
  milestones: {
    peakDay: ProductAnalyticsMilestone;
    lowestActiveDay: ProductAnalyticsMilestone;
    peakHour: {
      hour: number;
      label: string;
      quantity: number;
      revenue: number;
    };
  };
  timeline: ProductAnalyticsTimelinePoint[];
  dayOfWeekPattern: DayOfWeekPatternPoint[];
  hourlyDistribution: HourlyDistributionPoint[];
}

