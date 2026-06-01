'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  Check,
  Loader2,
  Package,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileText,
  Truck,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import Pagination from '@/components/admin/Pagination';
import { orderApi, Order, formatOrderDate, formatCurrency, ORDER_STATUS_COLORS } from '@/lib/api/orders';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================================================
// Types - Map API response to UI expectations
// ============================================================================

type OrderStatusType = 'pending_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'payment_failed' | 'payment_expired';

interface UIOrderItem {
  title: string;
  image: string;
  price: string;
  itemTotal: string;
  effectivePrice?: number;
  quantity: number;
  attributes: Record<string, string>;
  _idx: number;
  _uniqueKey: string;
}

interface UIOrder {
  id: string;
  orderId: string;
  customer: string;
  date: string;
  status: string;
  statusRaw: string;
  statusColor: string;
  payment: string;
  totalAmount?: number;
  subtotal?: number;
  couponDiscount?: number;
  itemTax?: number;
  shippingCost?: number;
  isConfirmed?: boolean;
  items: UIOrderItem[];
}

type TabStatus = 'All order' | 'Completed' | 'Pending' | 'Processing' | 'Canceled';

const STATUS_TAB_MAPPING: Record<Exclude<TabStatus, 'All order'>, OrderStatusType[]> = {
  'Completed': ['delivered'],
  'Pending': ['pending_payment', 'payment_failed', 'payment_expired'],
  'Processing': ['processing'],
  'Canceled': ['cancelled', 'returned'],
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'text-orange-500',
  processing: 'text-[#4EA674]',
  shipped: 'text-[#6467F2]',
  delivered: 'text-brand-dark',
  cancelled: 'text-[#FF6B6B]',
  returned: 'text-[#FF6B6B]',
  payment_failed: 'text-[#FF6B6B]',
  payment_expired: 'text-[#FF6B6B]',
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Completed',
  cancelled: 'Cancelled',
  returned: 'Returned',
  payment_failed: 'Payment Failed',
  payment_expired: 'Payment Expired',
};

// Mock filter options
const brands = ['Pahadi Collections', 'Tanishq', 'CaratLane', 'Malabar', 'Kalyan', 'Reliance Jewels'];
const categories = [
  'Necklaces', 'Earrings', 'Rings', 'Bangles', 'Bracelets', 
  'Anklets', 'Pendants', 'Nose Pins', 'Jewellery Sets', 'Others'
];

// ============================================================================
// Transform API data to UI format
// ============================================================================

function transformOrder(apiOrder: Order, index: number): UIOrder {
  const statusRaw = apiOrder.orderStatusRaw || apiOrder.orderStatus;
  const statusKey = statusRaw.toLowerCase().replace(/ /g, '_');

  return {
    id: apiOrder._id || `order-${index}`,
    orderId: apiOrder.orderId || `#${apiOrder._id?.slice(0, 2).toUpperCase()}${apiOrder._id?.slice(-2).toUpperCase() || 'XX'}`,
    customer: `${apiOrder.customerPhone} (${apiOrder.customerName})`,
    date: formatOrderDate(apiOrder.createdAt),
    status: STATUS_LABELS[statusKey] || statusRaw,
    statusRaw: statusKey,
    statusColor: STATUS_COLORS[statusKey] || 'text-brand-dark',
    payment: apiOrder.paymentMethod || 'Online',
    totalAmount: apiOrder.totalAmount,
    subtotal: apiOrder.subtotal,
    couponDiscount: apiOrder.couponDiscount,
    itemTax: apiOrder.itemTax,
    shippingCost: apiOrder.shippingCost,
    isConfirmed: apiOrder.isConfirmed,
    items: apiOrder.items.map((item, idx) => ({
      title: item.title,
      image: item.coverImage || '/placeholder.png',
      price: formatCurrency(item.price),
      itemTotal: formatCurrency(item.itemTotal),
      effectivePrice: item.effectivePrice,
      quantity: item.quantity,
      attributes: item.attributes || {},
      _idx: idx,
      _uniqueKey: `${index}-${idx}`,
    })),
  };
}

// ============================================================================
// Modals
// ============================================================================

interface CancelModalProps {
  order: UIOrder;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

function CancelModal({ order, onClose, onConfirm, isPending }: CancelModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <XCircle size={18} className="text-[#FF6B6B]" /> Cancel Order
          </h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted">
            Are you sure you want to cancel this order? This action cannot be undone.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Order ID:</span>
              <span className="font-bold text-primary">{order.orderId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Customer:</span>
              <span className="font-medium text-primary">{order.customer}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Cancellation Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for cancellation..."
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors resize-none"
              rows={3}
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted hover:text-primary transition-colors">Back</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isPending}
            className="px-6 py-2 bg-[#FF6B6B] text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}

interface TrackModalProps {
  order: UIOrder;
  trackingData: any;
  isLoading: boolean;
  onClose: () => void;
}

function TrackModal({ order, trackingData, isLoading, onClose }: TrackModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-brand/5">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <Truck size={18} className="text-brand" /> Track Order
          </h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-brand" />
              <span className="ml-2 text-muted">Loading tracking info...</span>
            </div>
          ) : trackingData?.shipments?.[0] ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted uppercase">Tracking Number</span>
                  <span className="text-sm font-bold text-primary">{trackingData.shipments[0].trackingNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted uppercase">Courier</span>
                  <span className="text-sm font-medium text-primary">{trackingData.shipments[0].provider || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted uppercase">Status</span>
                  <span className={`text-sm font-bold ${ORDER_STATUS_COLORS[trackingData.shipments[0].trackingData?.trackStatus] || 'text-primary'}`}>
                    {trackingData.shipments[0].trackingData?.currentStatus || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                {trackingData.shipments[0].trackUrl && (
                  <a
                    href={trackingData.shipments[0].trackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-[#6467F2] text-white rounded-lg text-sm font-bold hover:bg-[#5558e3] transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Track on Courier
                  </a>
                )}
                {trackingData.shipments[0].labelUrl && (
                  <a
                    href={trackingData.shipments[0].labelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-[#4EA674] text-white rounded-lg text-sm font-bold hover:bg-[#3d8c60] transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText size={16} />
                    Print Label
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package size={32} className="mx-auto text-muted mb-2" />
              <p className="text-sm text-muted">No tracking information available yet.</p>
              <p className="text-xs text-muted mt-1">Dispatch the order first to get tracking details.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-muted hover:text-primary transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

interface DispatchModalProps {
  order: UIOrder;
  onClose: () => void;
  onDispatch: () => void;
  isPending: boolean;
}

function DispatchModal({ order, onClose, onDispatch, isPending }: DispatchModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-brand/5">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <Package size={18} className="text-brand" /> Dispatch Order
          </h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted">
            This will create a shipment with Shiprocket and generate a shipping label. Continue?
          </p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Order ID:</span>
              <span className="font-bold text-primary">{order.orderId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Customer:</span>
              <span className="font-medium text-primary">{order.customer}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Items:</span>
              <span className="font-medium text-primary">{order.items.length}</span>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted hover:text-primary transition-colors">Cancel</button>
          <button
            onClick={onDispatch}
            disabled={isPending}
            className="px-6 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            Dispatch
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReturnManageModalProps {
  order: UIOrder;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onReceived: () => void;
  onRefund: () => void;
  isPending: boolean;
  actionType: 'approve' | 'reject' | 'received' | 'refund' | null;
}

function ReturnManageModal({ order, onClose, onApprove, onReject, onReceived, onRefund, isPending, actionType }: ReturnManageModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <RotateCcw size={18} className="text-purple-500" /> Manage Return
          </h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Order ID:</span>
              <span className="font-bold text-primary">{order.orderId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Customer:</span>
              <span className="font-medium text-primary">{order.customer}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Total:</span>
              <span className="font-bold text-[#FF6B6B]">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted font-medium">Return Workflow:</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded font-bold">1. Approve</span>
              <span className="text-muted">→</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded font-bold">2. Received</span>
              <span className="text-muted">→</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded font-bold">3. Refund</span>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onApprove}
            disabled={isPending || actionType === 'approve'}
            className="flex-1 py-2 bg-purple-500 text-white rounded-lg text-sm font-bold hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionType === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Approve
          </button>
          <button
            onClick={onReceived}
            disabled={isPending || actionType === 'received'}
            className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionType === 'received' ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
            Mark Received
          </button>
          <button
            onClick={onRefund}
            disabled={isPending || actionType === 'refund'}
            className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionType === 'refund' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refund
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>('All order');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchCategory, setSearchCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [cancelModal, setCancelModal] = useState<UIOrder | null>(null);
  const [trackModal, setTrackModal] = useState<UIOrder | null>(null);
  const [dispatchModal, setDispatchModal] = useState<UIOrder | null>(null);
  const [returnModal, setReturnModal] = useState<UIOrder | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);

  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const sortModalRef = useRef<HTMLDivElement>(null);
  const filterModalRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  // Fetch orders from API
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['orders', activeTab, currentPage],
    queryFn: async () => {
      const response = await orderApi.list({ page: currentPage, limit: 10 });
      return response;
    },
  });

  // Transform API orders to UI format
  const uiOrders: UIOrder[] = (ordersData?.orders || []).map((order, index) => transformOrder(order, index));

  // Calculate KPI totals
  const totalOrders = ordersData?.pagination?.total || 0;
  const processingCount = uiOrders.filter(o => o.status === 'Processing').length;
  const shippedCount = uiOrders.filter(o => o.status === 'Shipped').length;
  const cancelledCount = uiOrders.filter(o => o.status === 'Cancelled').length;

  // Mutations
  const dispatchMutation = useMutation({
    mutationFn: async (id: string) => {
      return await orderApi.dispatch(id);
    },
    onSuccess: () => {
      toast.success('Order dispatched successfully');
      setDispatchModal(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to dispatch order');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await orderApi.updateStatus(id, { orderStatus: 'cancelled', comment: reason });
    },
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      setCancelModal(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    },
  });

  const trackMutation = useMutation({
    mutationFn: async (id: string) => {
      return await orderApi.track(id);
    },
    onSuccess: (data) => {
      setTrackingData(data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to fetch tracking');
    },
  });

  const returnApproveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await orderApi.returnApprove(id, {});
    },
    onSuccess: () => {
      toast.success('Return approved');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve return');
    },
  });

  const returnReceivedMutation = useMutation({
    mutationFn: async (id: string) => {
      return await orderApi.returnReceived(id, {});
    },
    onSuccess: () => {
      toast.success('Item marked as received');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark as received');
    },
  });

  const returnRefundMutation = useMutation({
    mutationFn: async (id: string) => {
      return await orderApi.returnRefund(id, {});
    },
    onSuccess: () => {
      toast.success('Refund processed successfully');
      setReturnModal(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    },
  });

  // Handlers
  const handleTrack = (order: UIOrder) => {
    setTrackModal(order);
    trackMutation.mutate(order.id);
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortModalRef.current && !sortModalRef.current.contains(event.target as Node)) setShowSortModal(false);
      if (filterModalRef.current && !filterModalRef.current.contains(event.target as Node)) setShowFilterModal(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(searchCategory.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-[1600px] mx-auto">
      {/* Tabs and Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-surface p-4 rounded-xl border border-border">
        <div className="flex items-center gap-1 bg-background p-1 rounded-lg overflow-x-auto w-full xl:w-auto scrollbar-hide">
          {(['All order', 'Completed', 'Pending', 'Processing', 'Canceled'] as TabStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all flex-1 xl:flex-none ${
                activeTab === tab ? 'bg-surface text-brand-dark shadow-sm' : 'text-muted hover:text-primary'
              }`}
            >
              {tab} {tab === 'All order' && <span className="ml-1 opacity-60">({totalOrders || 0})</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:min-w-[240px]">
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setShowFilterModal(!showFilterModal)}
                className={`w-full sm:w-auto p-2 border border-border rounded-lg hover:bg-background transition-colors flex items-center justify-center gap-2 ${showFilterModal ? 'bg-background text-brand-dark border-brand' : 'text-muted'}`}
              >
                <Filter size={20} />
                <span className="sm:hidden text-xs font-bold uppercase">Filter</span>
              </button>
              {showFilterModal && (
                <div ref={filterModalRef} className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[320px] bg-surface border border-border rounded-xl shadow-xl z-50 p-6 animate-in fade-in zoom-in-95 duration-200">
                  {/* ... filter modal content ... */}
                </div>
              )}
            </div>

            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setShowSortModal(!showSortModal)}
                className={`w-full sm:w-auto p-2 border border-border rounded-lg hover:bg-background transition-colors flex items-center justify-center gap-2 ${showSortModal ? 'bg-background text-brand-dark border-brand' : 'text-muted'}`}
              >
                <SlidersHorizontal size={20} />
                <span className="sm:hidden text-xs font-bold uppercase">Sort</span>
              </button>
              {showSortModal && (
                <div ref={sortModalRef} className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-100">
                  {/* ... sort modal content ... */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order List */}
      <div className="space-y-6">
        {/* Global Table Header */}
        <div className="hidden lg:grid grid-cols-[2fr_1.2fr_1.2fr_1.5fr_1.2fr] gap-4 px-8 py-4 bg-[#F2F9F4] rounded-xl border border-border shadow-sm mb-4">
          <span className="text-sm font-bold text-brand-dark">Products Title</span>
          <span className="text-sm font-bold text-brand-dark">Price</span>
          <span className="text-sm font-bold text-brand-dark">Payment</span>
          <span className="text-sm font-bold text-brand-dark">Status</span>
          <span className="text-sm font-bold text-brand-dark text-right">Action</span>
        </div>

        {/* Loading/Empty State */}
        {isLoading ? (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <Loader2 size={24} className="animate-spin text-brand mx-auto mb-2" />
            <p className="text-muted">Loading orders...</p>
          </div>
        ) : uiOrders.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <Package size={32} className="mx-auto text-muted mb-2" />
            <p className="text-muted">No orders found</p>
          </div>
        ) : (
          /* Orders */
          <div className="space-y-3">
            {uiOrders.map((order, orderIdx) => {
              const isExpanded = expandedOrders.includes(order.id);
              const itemsToShow = isExpanded ? order.items : [order.items[0]];
              const hasMultipleItems = order.items.length > 1;

              return (
                <div key={order.id || `order-${orderIdx}`} className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden transition-all">
                  {/* Order Header Row */}
                  <div className="px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm">
                    <div className="flex flex-wrap items-center gap-4 md:gap-6">
                      <input type="checkbox" className="w-4 h-4 rounded border-border text-brand focus:ring-brand" />
                      <div className="flex items-center gap-1">
                        <span className="text-muted">Customer:</span>
                        <span className="font-medium text-primary">{order.customer}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-primary">Date:</span>
                        <span className="font-bold text-primary">{order.date}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 text-sm border-t md:border-t-0 pt-4 md:pt-0">
                      <div className="text-right">
                        <span className="text-muted">Subtotal:</span>
                        <span className="font-medium text-primary ml-1">{formatCurrency(order.subtotal)}</span>
                      </div>
                      {(order.couponDiscount ?? 0) > 0 && (
                        <div className="text-right">
                          <span className="text-muted">Discount:</span>
                          <span className="font-medium text-[#4EA674] ml-1">-{formatCurrency(order.couponDiscount)}</span>
                        </div>
                      )}
                      <div className="text-right">
                        <span className="text-muted font-bold">Total:</span>
                        <span className="font-bold text-brand-dark ml-1">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dotted Separator */}
                  <div className="px-8">
                    <div className="border-t border-dotted border-border w-full" />
                  </div>

                  {/* Products List */}
                  <div className="divide-y divide-border/30">
                    {itemsToShow.map((item, idx) => (
                      <div key={item._uniqueKey} className="grid grid-cols-1 lg:grid-cols-[2fr_1.2fr_1.2fr_1.5fr_1.2fr] gap-4 px-8 py-6 items-center">

                        {/* Product Details */}
                        <div className="flex items-center gap-5">
                          <div className="w-20 h-20 rounded-lg bg-background border border-border overflow-hidden flex-shrink-0">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-[15px] font-bold text-primary leading-snug line-clamp-2">{item.title}</h4>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
                              {Object.entries(item.attributes).map(([attrKey, value]) => (
                                <span key={attrKey}>{attrKey}: <span className="text-primary font-medium">{value}</span></span>
                              ))}
                            </div>
                            <div className="text-xs text-muted">
                              Quantity: <span className="text-primary font-medium">{item.quantity}</span>
                            </div>

                            {/* Multiple Items Indicator */}
                            {hasMultipleItems && !isExpanded && idx === 0 && (
                              <button
                                onClick={() => toggleOrderExpansion(order.id)}
                                className="mt-2 text-xs font-bold text-brand hover:underline flex items-center gap-1"
                              >
                                +{order.items.length - 1} more product{order.items.length > 2 ? 's' : ''}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-sm font-bold text-primary">{item.price}</div>

                        {/* Payment */}
                        <div className="text-sm font-medium text-muted">{order.payment}</div>

                        {/* Status */}
                        <div className="space-y-1">
                          <div className={`text-sm font-bold flex items-center gap-2 ${order.statusColor}`}>
                            <div className={`w-2 h-2 rounded-full bg-current`} />
                            {order.status}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex lg:flex-col items-center lg:items-end gap-2">
                          {/* Processing Actions */}
                          {order.statusRaw === 'processing' && (
                            <>
                              <button
                                onClick={() => setDispatchModal(order)}
                                className="w-full lg:w-28 py-1.5 bg-[#6467F2] text-white rounded-lg text-xs font-bold hover:bg-[#5558e3] transition-colors flex items-center justify-center gap-1"
                              >
                                <Package size={12} /> Dispatch
                              </button>
                              <button
                                onClick={() => setCancelModal(order)}
                                className="w-full lg:w-28 py-1.5 bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20 rounded-lg text-xs font-bold hover:bg-[#FF6B6B]/20 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {/* Shipped Actions */}
                          {order.statusRaw === 'shipped' && (
                            <>
                              <button
                                onClick={() => handleTrack(order)}
                                className="w-full lg:w-28 py-1.5 bg-[#6467F2] text-white rounded-lg text-xs font-bold hover:bg-[#5558e3] transition-colors flex items-center justify-center gap-1"
                              >
                                <Truck size={12} /> Track
                              </button>
                              <button
                                onClick={() => handleTrack(order)}
                                className="w-full lg:w-28 py-1.5 bg-[#4EA674] text-white rounded-lg text-xs font-bold hover:bg-[#3d8c60] transition-colors flex items-center justify-center gap-1"
                              >
                                <FileText size={12} /> Label
                              </button>
                            </>
                          )}

                          {/* Delivered Actions */}
                          {order.statusRaw === 'delivered' && (
                            <>
                              <button className="w-full lg:w-28 py-1.5 bg-[#4EA674] text-white rounded-lg text-xs font-bold hover:bg-[#3d8c60] transition-colors flex items-center justify-center gap-1">
                                <FileText size={12} /> Invoice
                              </button>
                            </>
                          )}

                          {/* Cancelled Actions */}
                          {order.statusRaw === 'cancelled' && (
                            <>
                              <button className="w-full lg:w-28 py-1.5 bg-[#FF6B6B] text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-1">
                                <RefreshCw size={12} /> Refund
                              </button>
                            </>
                          )}

                          {/* Returned Actions */}
                          {order.statusRaw === 'returned' && (
                            <>
                              <button
                                onClick={() => setReturnModal(order)}
                                className="w-full lg:w-28 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-bold hover:bg-purple-600 transition-colors flex items-center justify-center gap-1"
                              >
                                <RotateCcw size={12} /> Manage
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Show Less Button when expanded */}
                  {hasMultipleItems && isExpanded && (
                    <button
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="w-full py-2 bg-background/50 hover:bg-background text-xs font-bold text-muted hover:text-brand transition-colors border-t border-border/30"
                    >
                      Show less
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={ordersData?.pagination?.totalPages || 1}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Modals */}
      {cancelModal && (
        <CancelModal
          order={cancelModal}
          onClose={() => setCancelModal(null)}
          onConfirm={(reason) => cancelMutation.mutate({ id: cancelModal.id, reason })}
          isPending={cancelMutation.isPending}
        />
      )}

      {trackModal && (
        <TrackModal
          order={trackModal}
          trackingData={trackingData}
          isLoading={trackMutation.isPending}
          onClose={() => { setTrackModal(null); setTrackingData(null); }}
        />
      )}

      {dispatchModal && (
        <DispatchModal
          order={dispatchModal}
          onClose={() => setDispatchModal(null)}
          onDispatch={() => dispatchMutation.mutate(dispatchModal.id)}
          isPending={dispatchMutation.isPending}
        />
      )}

      {returnModal && (
        <ReturnManageModal
          order={returnModal}
          onClose={() => setReturnModal(null)}
          onApprove={() => returnApproveMutation.mutate(returnModal.id)}
          onReject={() => {}}
          onReceived={() => returnReceivedMutation.mutate(returnModal.id)}
          onRefund={() => returnRefundMutation.mutate(returnModal.id)}
          isPending={returnApproveMutation.isPending || returnReceivedMutation.isPending || returnRefundMutation.isPending}
          actionType={returnApproveMutation.isPending ? 'approve' : returnReceivedMutation.isPending ? 'received' : returnRefundMutation.isPending ? 'refund' : null}
        />
      )}
    </div>
  );
}