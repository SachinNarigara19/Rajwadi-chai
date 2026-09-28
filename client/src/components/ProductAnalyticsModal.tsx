import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  DollarSign,
  Award,
  AlertTriangle,
  Clock,
  Sparkles,
  BarChart2,
  PieChart,
  RefreshCw,
  Flame,
  Zap,
  Info,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
  Legend,
} from 'recharts';
import { ProductAnalytics } from '../types';
import { api } from '../api/client';

interface ProductAnalyticsModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductAnalyticsModal: React.FC<ProductAnalyticsModalProps> = ({
  productId,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative bg-white border border-stone-200 rounded-3xl shadow-2xl max-w-5xl w-full my-6 max-h-[92vh] flex flex-col overflow-hidden">
        <ProductAnalyticsContent productId={productId} onClose={onClose} isModal={true} />
      </div>
    </div>
  );
};

interface ProductAnalyticsContentProps {
  productId: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const ProductAnalyticsContent: React.FC<ProductAnalyticsContentProps> = ({
  productId,
  onClose,
  isModal = false,
}) => {
  const [data, setData] = useState<ProductAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('30d');
  const [activeChartMetric, setActiveChartMetric] = useState<'quantity' | 'revenue'>('quantity');
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ success: boolean } & ProductAnalytics>(
        `/products/${productId}/analytics?period=${period}`
      );
      if (res.success) {
        setData(res);
      } else {
        throw new Error('Failed to load product analytics');
      }
    } catch (err: any) {
      console.error('Analytics load error:', err);
      setError(err.message || 'Could not retrieve sales analytics for this product.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchAnalytics();
    }
  }, [productId, period]);

  // Velocity badge styling
  const getVelocityBadge = (rating?: string) => {
    switch (rating) {
      case 'HOT_SELLER':
        return {
          icon: <Flame className="w-4 h-4 text-emerald-500 fill-emerald-500" />,
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          label: '🔥 High Sell Bestseller',
        };
      case 'HIGH_VOLUME':
        return {
          icon: <Zap className="w-4 h-4 text-sky-500 fill-sky-500" />,
          bg: 'bg-sky-50 border-sky-200 text-sky-800',
          label: '⚡ High Demand Mover',
        };
      case 'STEADY_SELLER':
        return {
          icon: <TrendingUp className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          label: '✨ Steady Performer',
        };
      case 'SLOW_MOVER':
        return {
          icon: <TrendingDown className="w-4 h-4 text-orange-600" />,
          bg: 'bg-orange-50 border-orange-200 text-orange-800',
          label: '🐢 Low Sell / Slow Mover',
        };
      case 'DEAD_STOCK':
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          label: '⚠️ Stagnant / Zero Sales',
        };
    }
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const isHigh = point.tag === 'HIGH_SELL';
      const isLow = point.tag === 'LOW_SELL';
      const isZero = point.tag === 'ZERO_SELL';

      return (
        <div className="bg-stone-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-stone-700 text-xs min-w-[210px] space-y-2">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
            <span className="font-bold text-stone-200">
              {point.formattedDate} ({point.dayOfWeek})
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isHigh
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : isLow
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : isZero
                  ? 'bg-stone-800 text-stone-400'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {isHigh ? '🔥 High Sell' : isLow ? '🐢 Low Sell' : isZero ? '⚪ No Sales' : '⚡ Average'}
            </span>
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex justify-between items-center text-stone-300">
              <span>Units Sold:</span>
              <span className="font-bold text-amber-400 text-sm">
                {point.quantity} {data?.product.unit || 'Units'}
              </span>
            </div>
            <div className="flex justify-between items-center text-stone-300">
              <span>Gross Revenue:</span>
              <span className="font-semibold text-emerald-400">₹{point.revenue}</span>
            </div>
            <div className="flex justify-between items-center text-stone-300">
              <span>Gross Profit:</span>
              <span className="font-semibold text-teal-300">₹{point.profit}</span>
            </div>
            <div className="flex justify-between items-center text-stone-400 text-[11px] pt-1 border-t border-stone-800">
              <span>Invoices:</span>
              <span>{point.salesCount} orders</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-stone-200 bg-stone-50/70">
        <div className="flex items-center space-x-3.5">
          <div className="relative shrink-0">
            <img
              src={
                data?.product.imageUrl ||
                'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=150&q=80'
              }
              alt={data?.product.name || 'Product'}
              className="w-13 h-13 rounded-2xl object-cover border border-stone-200 shadow-xs"
            />
            {data?.metrics.velocity.rating === 'HOT_SELLER' && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm">
                🔥
              </span>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900 leading-tight">
                {data?.product.name || 'Product Analytics'}
              </h2>
              {data && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    getVelocityBadge(data.metrics.velocity.rating).bg
                  }`}
                >
                  {getVelocityBadge(data.metrics.velocity.rating).icon}
                  <span>{getVelocityBadge(data.metrics.velocity.rating).label}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1 font-medium">
              <span>SKU: <strong className="text-stone-700 font-mono">{data?.product.sku}</strong></span>
              <span>•</span>
              <span>Category: <strong className="text-stone-700">{data?.product.category}</strong></span>
              <span>•</span>
              <span>Price: <strong className="text-stone-900 font-mono">₹{data?.product.sellingPrice}</strong></span>
              <span>•</span>
              <span>
                Stock:{' '}
                <strong
                  className={`font-mono ${
                    (data?.product.currentStock || 0) <= (data?.product.minStockLevel || 0)
                      ? 'text-rose-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {data?.product.currentStock} {data?.product.unit}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Time period selector and actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center bg-stone-200/80 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: '7d', label: '7 Days' },
              { id: '14d', label: '14 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: 'all', label: 'All' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  period === p.id
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 rounded-xl transition"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
        {loading && !data ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-500 font-medium">Calculating individual sales trends and performance...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : data ? (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
              {/* Total Units Sold */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Total Units Sold
                </span>
                <div className="mt-2">
                  <div className="text-2xl font-black text-stone-900 font-mono">
                    {data.metrics.totalUnitsSold}{' '}
                    <span className="text-xs font-normal text-stone-500">{data.product.unit}</span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1 font-medium">
                    <span className="text-amber-700 font-bold font-mono">{data.metrics.averageDailyUnits}</span>
                    <span>/ day avg</span>
                  </div>
                </div>
              </div>

              {/* Total Revenue & Profit */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Revenue & Profit
                </span>
                <div className="mt-2">
                  <div className="text-2xl font-black text-stone-900 font-mono">
                    ₹{data.metrics.totalRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                    <span>Profit: ₹{data.metrics.grossProfit.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] font-bold bg-emerald-100 px-1 rounded">
                      {data.metrics.profitMargin}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Peak Sales Day (High Sell Milestone) */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-emerald-600" /> High Sell Peak
                </span>
                <div className="mt-2">
                  <div className="text-xl font-black text-emerald-950 font-mono">
                    {data.milestones.peakDay.quantity > 0 ? (
                      `${data.milestones.peakDay.quantity} ${data.product.unit}`
                    ) : (
                      'None'
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-800 font-medium mt-0.5 truncate">
                    {data.milestones.peakDay.date ? (
                      `${data.milestones.peakDay.formattedDate} (${data.milestones.peakDay.dayOfWeek})`
                    ) : (
                      'No sales in period'
                    )}
                  </div>
                </div>
              </div>

              {/* Slowest Active Day (Low Sell Benchmark) */}
              <div className="bg-orange-50/60 p-4 rounded-2xl border border-orange-200/80 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-orange-600" /> Low Sell Dip
                </span>
                <div className="mt-2">
                  <div className="text-xl font-black text-orange-950 font-mono">
                    {data.milestones.lowestActiveDay.quantity > 0 ? (
                      `${data.milestones.lowestActiveDay.quantity} ${data.product.unit}`
                    ) : (
                      '0 Units'
                    )}
                  </div>
                  <div className="text-[11px] text-orange-800 font-medium mt-0.5 truncate">
                    {data.metrics.zeroSalesDaysCount > 0
                      ? `${data.metrics.zeroSalesDaysCount} days zero sell`
                      : `${data.milestones.lowestActiveDay.formattedDate}`}
                  </div>
                </div>
              </div>

              {/* Stock Runway Remaining */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" /> Stock Runway
                </span>
                <div className="mt-2">
                  <div
                    className={`text-xl font-black font-mono ${
                      data.metrics.runwayDays <= 3
                        ? 'text-rose-600'
                        : data.metrics.runwayDays <= 7
                        ? 'text-amber-600'
                        : 'text-stone-900'
                    }`}
                  >
                    {data.metrics.runwayDays === 999
                      ? 'N/A'
                      : data.metrics.runwayStatus === 'OUT_OF_STOCK'
                      ? 'Out of Stock'
                      : `~${data.metrics.runwayDays} Days`}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5 font-medium truncate">
                    {data.metrics.runwayDays <= 7
                      ? '⚠️ Restock recommended'
                      : data.metrics.runwayDays > 60
                      ? '📦 Ample inventory'
                      : '✅ Healthy stock level'}
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Interactive Sales Trends Graph */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-amber-600" />
                    <span>Daily Sales Velocity & Trends Graph</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Continuous timeline with automated High Sell (Green) and Low Sell (Rose) benchmarking
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setActiveChartMetric('quantity')}
                      className={`px-3 py-1 rounded-lg transition ${
                        activeChartMetric === 'quantity'
                          ? 'bg-white text-stone-900 shadow-xs font-bold'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Units Sold ({data.product.unit})
                    </button>
                    <button
                      onClick={() => setActiveChartMetric('revenue')}
                      className={`px-3 py-1 rounded-lg transition ${
                        activeChartMetric === 'revenue'
                          ? 'bg-white text-stone-900 shadow-xs font-bold'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Revenue & Profit (₹)
                    </button>
                  </div>
                </div>
              </div>

              {/* Threshold Legend Bar */}
              <div className="flex flex-wrap items-center gap-4 text-xs bg-stone-50/80 px-4 py-2.5 rounded-2xl border border-stone-100">
                <span className="font-semibold text-stone-600">Threshold Guides:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-stone-700">
                    High Sell Mark: <strong>≥ {data.metrics.highSellThreshold}</strong> {data.product.unit}/day
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="text-stone-700">
                    Average: <strong>{data.metrics.averageDailyUnits}</strong> {data.product.unit}/day
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                  <span className="text-stone-700">
                    Low Sell Mark: <strong>≤ {data.metrics.lowSellThreshold}</strong> {data.product.unit}/day
                  </span>
                </div>
              </div>

              {/* Chart */}
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data.timeline}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                    <XAxis
                      dataKey="formattedDate"
                      tick={{ fill: '#78716c', fontSize: 11 }}
                      axisLine={{ stroke: '#d6d3d1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#78716c', fontSize: 11 }}
                      axisLine={{ stroke: '#d6d3d1' }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {activeChartMetric === 'quantity' ? (
                      <>
                        <ReferenceLine
                          y={data.metrics.highSellThreshold}
                          stroke="#10b981"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: 'High Sell Mark',
                            fill: '#059669',
                            fontSize: 10,
                            position: 'top',
                          }}
                        />
                        <ReferenceLine
                          y={data.metrics.averageDailyUnits}
                          stroke="#f59e0b"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                        />
                        <ReferenceLine
                          y={data.metrics.lowSellThreshold}
                          stroke="#f43f5e"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                        />

                        {/* Bar with dynamic High Sell / Average / Low Sell cell colors */}
                        <Bar
                          dataKey="quantity"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                          animationDuration={600}
                        >
                          {data.timeline.map((entry, index) => {
                            let fillColor = '#cbd5e1'; // Zero sell default
                            if (entry.tag === 'HIGH_SELL') fillColor = '#10b981'; // Emerald
                            else if (entry.tag === 'LOW_SELL') fillColor = '#fb7185'; // Rose
                            else if (entry.tag === 'AVERAGE_SELL') fillColor = '#f59e0b'; // Amber
                            return <Cell key={`cell-${index}`} fill={fillColor} />;
                          })}
                        </Bar>
                        <Line
                          type="monotone"
                          dataKey="quantity"
                          stroke="#b45309"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#b45309' }}
                          activeDot={{ r: 6 }}
                        />
                      </>
                    ) : (
                      <>
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#d97706"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#revenueGrad)"
                          name="Revenue"
                        />
                        <Area
                          type="monotone"
                          dataKey="profit"
                          stroke="#059669"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#profitGrad)"
                          name="Profit"
                        />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* High Sell vs Low Sell Deep Dive Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* High Sell Insights */}
              <div className="bg-emerald-50/40 p-5 rounded-3xl border border-emerald-200 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-800">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-sm">High Sell Peaks & Highlights</h4>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <span className="text-stone-600">Peak Single Day Volume:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {data.milestones.peakDay.quantity > 0
                        ? `${data.milestones.peakDay.quantity} ${data.product.unit} (₹${data.milestones.peakDay.revenue})`
                        : 'No sales recorded'}
                    </span>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <span className="text-stone-600">Peak Selling Time Window:</span>
                    <span className="font-bold text-emerald-700">
                      {data.milestones.peakHour.label !== 'None'
                        ? `${data.milestones.peakHour.label} (${data.milestones.peakHour.quantity} ${data.product.unit})`
                        : 'N/A'}
                    </span>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <span className="text-stone-600">High Volume Sales Days:</span>
                    <span className="font-bold text-emerald-700">
                      {data.metrics.highSellDaysCount} days in this period
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-900/80 leading-relaxed pt-1">
                  💡 <strong>Tip for High Sellers:</strong> Keep safety stock buffered by at least 15% above the minimum
                  alert level to avoid losing revenue during rush hours.
                </p>
              </div>

              {/* Low Sell & Slow Mover Alerts */}
              <div className="bg-orange-50/40 p-5 rounded-3xl border border-orange-200 space-y-3">
                <div className="flex items-center space-x-2 text-orange-900">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-orange-600" />
                  </div>
                  <h4 className="font-bold text-sm">Low Sell Dips & Recommendations</h4>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-white/80 p-3 rounded-xl border border-orange-100 flex items-center justify-between">
                    <span className="text-stone-600">Slowest Active Sales Day:</span>
                    <span className="font-bold text-orange-800 font-mono">
                      {data.milestones.lowestActiveDay.quantity > 0
                        ? `${data.milestones.lowestActiveDay.quantity} ${data.product.unit} on ${data.milestones.lowestActiveDay.formattedDate}`
                        : '0 Units'}
                    </span>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-orange-100 flex items-center justify-between">
                    <span className="text-stone-600">Zero-Sales Days:</span>
                    <span className="font-bold text-orange-800">
                      {data.metrics.zeroSalesDaysCount} of {data.dateRange.daysCount} days
                    </span>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-orange-100 flex items-center justify-between">
                    <span className="text-stone-600">Slow Demand Days:</span>
                    <span className="font-bold text-orange-800">
                      {data.metrics.lowSellDaysCount} low sell days
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-orange-950/80 leading-relaxed pt-1">
                  💡 <strong>Action Recommendation:</strong>{' '}
                  {data.metrics.zeroSalesDaysCount > 10
                    ? 'Bundle this item with high-volume Chai or run a 10% combo discount on slower weekdays to liquidate tied-up stock.'
                    : 'Sales are healthy. Adjust procurement batches to match the weekly demand cycle.'}
                </p>
              </div>
            </div>

            {/* Day of Week Pattern & Hourly Rush Hours Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Day of Week Pattern */}
              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Day-of-Week Sales Performance</span>
                  </h4>
                  <span className="text-[11px] text-stone-400 font-medium">Avg Units/Day</span>
                </div>

                <div className="h-44 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.dayOfWeekPattern} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                      <XAxis dataKey="shortDay" tick={{ fill: '#78716c', fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fill: '#78716c', fontSize: 10 }} tickLine={false} />
                      <Tooltip
                        formatter={(val: any) => [`${val} ${data.product.unit}`, 'Average Sold']}
                        labelFormatter={(label) => `Day: ${label}`}
                      />
                      <Bar dataKey="averageQty" radius={[6, 6, 0, 0]} maxBarSize={28}>
                        {data.dayOfWeekPattern.map((entry, index) => (
                          <Cell
                            key={`dow-cell-${index}`}
                            fill={entry.isPeak ? '#059669' : entry.isSlow ? '#f87171' : '#f59e0b'}
                          />
                        ))}
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Peak Day
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Slowest Day
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Normal Days
                  </span>
                </div>
              </div>

              {/* Hourly Rush Hours */}
              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Hourly Rush Time Distribution</span>
                  </h4>
                  <span className="text-[11px] text-stone-400 font-medium">6 AM - 11 PM</span>
                </div>

                <div className="h-44 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={data.hourlyDistribution}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                      <XAxis
                        dataKey="hourLabel"
                        tick={{ fill: '#78716c', fontSize: 9 }}
                        tickLine={false}
                        interval={2}
                      />
                      <YAxis tick={{ fill: '#78716c', fontSize: 10 }} tickLine={false} />
                      <Tooltip
                        formatter={(val: any) => [`${val} ${data.product.unit}`, 'Units Sold']}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Bar dataKey="quantity" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={16} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-100 flex items-center justify-between">
                  <span>Morning Rush: 7:00 AM - 10:00 AM</span>
                  <span>Evening Tea: 4:00 PM - 8:00 PM</span>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
