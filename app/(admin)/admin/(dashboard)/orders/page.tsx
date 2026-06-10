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
import { orderApi, returnApi, Order, OrderStatusType, formatOrderDate, formatCurrency, ORDER_STATUS_COLORS } from '@/lib/api/orders';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================================================
// Types - Map API response to UI format
// ============================================================================

interface UIOrderItem {
  id: string;
  title: string;
  image: string;
  price: string;
  itemTotal: string;
  effectivePrice?: number;
  quantity: number;
  attributes: Record<string, string>;
  itemStatus: string;
  refundStatus?: string;
  refundId?: string;
  refundAmount?: number;
  _idx: number;
  _uniqueKey: string;
}

interface UIOrder {
  id: string;
  orderId: string;
  customer: string;
  customerPhone: string;
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
  paymentStatus?: string;
  paidAmount?: number;
  remainingPaidAmount?: number;
  refundId?: string;
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
    customer: apiOrder.customerName || 'Unknown',
    customerPhone: apiOrder.customerPhone || 'N/A',
    date: formatOrderDate(apiOrder.createdAt),
    status: STATUS_LABELS[statusKey] || statusRaw,
    statusRaw: statusKey,
    statusColor: STATUS_COLORS[statusKey] || 'text-brand-dark',
    payment: apiOrder.paymentMethod || 'Online',
    totalAmount: apiOrder.totalAmount || 0,
    subtotal: apiOrder.subtotal || 0,
    couponDiscount: apiOrder.couponDiscount || 0,
    itemTax: apiOrder.itemTax || 0,
    shippingCost: apiOrder.shippingCost || 0,
    isConfirmed: apiOrder.isConfirmed,
    paymentStatus: apiOrder.paymentStatus,
    paidAmount: (apiOrder as any).paidAmount || 0,
    remainingPaidAmount: (apiOrder as any).remainingPaidAmount || 0,
    refundId: (apiOrder as any).refundId,
    items: apiOrder.items.map((item, idx) => ({
      id: item._id || `${apiOrder._id}-${idx}`,
      title: item.snapshot?.title || item.title || 'Unknown Product',
      image: item.snapshot?.coverImage || item.coverImage || '/placeholder.png',
      price: formatCurrency(item.price),
      itemTotal: formatCurrency(item.itemTotal),
      effectivePrice: item.effectivePrice,
      quantity: item.quantity,
      attributes: item.attributes || {},
      itemStatus: item.itemStatus || 'active',
      refundStatus: (item as any).refundStatus,
      refundId: (item as any).refundId,
      refundAmount: (item as any).refundAmount,
      _idx: idx,
      _uniqueKey: `${index}-${idx}`,
    })),
  };
}

// ============================================================================
// Modals
// ============================================================================

interface RefundModalProps {
  order: UIOrder;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

function RefundModal({ order, onClose, onConfirm, isPending }: RefundModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <RefreshCw size={18} className="text-orange-500" /> Process Refund
          </h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted">
            Process a refund of the remaining <span className="font-bold text-primary">{formatCurrency(order.remainingPaidAmount ?? order.totalAmount)}</span> via Razorpay. This cannot be reversed.
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
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Refund Reason (Optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Cancelled by customer..."
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors resize-none"
              rows={2}
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted hover:text-primary transition-colors">Cancel</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isPending}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            Confirm Refund
          </button>
        </div>
      </div>
    </div>
  );
}

interface RefundItemModalProps {
  order: UIOrder;
  item: UIOrderItem;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

function RefundItemModal({ order, item, onClose, onConfirm, isPending }: RefundItemModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <RefreshCw size={18} className="text-orange-500" /> Refund Product
          </h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted">
            Refund <span className="font-bold text-primary">{item.itemTotal}</span> for this product via Razorpay.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Order ID:</span>
              <span className="font-bold text-primary">{order.orderId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Product:</span>
              <span className="font-medium text-primary line-clamp-1 flex-1 text-right ml-4">{item.title}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Refund Reason (Optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Out of stock, Customer request..."
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors resize-none"
              rows={2}
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted hover:text-primary transition-colors">Cancel</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isPending}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            Issue Refund
          </button>
        </div>
      </div>
    </div>
  );
}

interface CancelModalProps {
  order: UIOrder;
  itemId?: string;
  itemTitle?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

function CancelModal({ order, itemId, itemTitle, onClose, onConfirm, isPending }: CancelModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <XCircle size={18} className="text-[#FF6B6B]" /> {itemId ? 'Cancel Item' : 'Cancel Order'}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted">
            Are you sure you want to cancel this {itemId ? 'item' : 'order'}? This action cannot be undone.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Order ID:</span>
              <span className="font-bold text-primary">{order.orderId}</span>
            </div>
            {itemId && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Item:</span>
                <span className="font-medium text-primary line-clamp-1 flex-1 text-right ml-4">{itemTitle}</span>
              </div>
            )}
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
            {itemId ? 'Cancel Item' : 'Cancel Order'}
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
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
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
                  <span className={`text-sm font-bold ${ORDER_STATUS_COLORS[trackingData.shipments[0].currentStatus] || 'text-primary'}`}>
                    {trackingData.shipments[0].currentStatus || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Status Steps / Timeline */}
              {trackingData.shipments[0].timeline && (
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {trackingData.shipments[0].timeline.map((step: any, idx: number) => (
                    <div key={idx} className="flex gap-4 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-brand' : 'bg-gray-300'} z-10 shadow-sm`} />
                        {idx !== trackingData.shipments[0].timeline.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-100" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className={`text-xs font-bold ${idx === 0 ? 'text-primary' : 'text-muted'}`}>{step.activity}</p>
                        <p className="text-[10px] text-muted">{step.location !== 'Unknown' ? `${step.location} | ` : ''}{step.date} {step.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
  onDispatch: (data: { weight: number, length: number, breadth: number, height: number }) => void;
  isPending: boolean;
}

function DispatchModal({ order, onClose, onDispatch, isPending }: DispatchModalProps) {
  const [weight, setWeight] = useState(0.5);
  const [length, setLength] = useState(10);
  const [breadth, setBreadth] = useState(10);
  const [height, setHeight] = useState(10);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-brand/5">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <Package size={18} className="text-brand" /> Dispatch Order
          </h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-sm text-muted">
            Configure package details for Shiprocket. Defaults are shown below.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Length (cm)</label>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Breadth (cm)</label>
                <input
                  type="number"
                  value={breadth}
                  onChange={(e) => setBreadth(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <div className="bg-brand/5 rounded-lg p-3 space-y-1 border border-brand/10">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Order:</span>
              <span className="font-bold text-primary">{order.orderId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Customer:</span>
              <span className="font-medium text-primary">{order.customer}</span>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted hover:text-primary transition-colors">Cancel</button>
          <button
            onClick={() => onDispatch({ weight, length, breadth, height })}
            disabled={isPending}
            className="px-6 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Dispatch'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReturnManageModalProps {
  order: UIOrder;
  request: any;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onReceived: () => void;
  onResolve: (data: { refundMethod: 'razorpay' | 'manual'; manualReference?: string }) => void;
  isPending: boolean;
  actionType: string | null;
}

function ReturnManageModal({ order, request, onClose, onApprove, onReject, onReceived, onResolve, isPending, actionType }: ReturnManageModalProps) {
  const [refundMethod, setRefundMethod] = useState<'razorpay' | 'manual'>('razorpay');
  const [manualRef, setManualRef] = useState('');

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <RotateCcw size={18} className="text-purple-500" /> Manage {request.type === 'return' ? 'Return' : 'Replacement'}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted font-medium">Customer:</span>
              <span className="font-bold text-primary">{order.customer} ({order.customerPhone})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted font-medium">Reason:</span>
              <span className="font-bold text-red-500">{request.reason}</span>
            </div>
            {request.customerComment && (
              <div className="text-sm">
                <span className="text-muted font-medium block mb-1">Customer Comment:</span>
                <span className="text-primary bg-white p-2 rounded border border-gray-100 block">{request.customerComment}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-xs font-bold text-muted uppercase tracking-widest">Process Flow</p>
            <div className="grid grid-cols-3 gap-2">
              <div className={`p-3 rounded-xl border text-center transition-all ${request.status === 'requested' ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                <p className="text-[10px] font-bold uppercase text-amber-600 mb-1">1. Approve</p>
                <p className="text-[9px] text-amber-500">Review & SR Pickup</p>
              </div>
              <div className={`p-3 rounded-xl border text-center transition-all ${request.status === 'approved' || request.status === 'pickup_scheduled' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                <p className="text-[10px] font-bold uppercase text-blue-600 mb-1">2. Receive</p>
                <p className="text-[9px] text-blue-500">Mark item as back</p>
              </div>
              <div className={`p-3 rounded-xl border text-center transition-all ${request.status === 'item_received' ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                <p className="text-[10px] font-bold uppercase text-green-600 mb-1">3. Resolve</p>
                <p className="text-[9px] text-green-500">Refund/Replace</p>
              </div>
            </div>
          </div>

          {request.status === 'item_received' && request.type === 'return' && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl space-y-4">
              <p className="text-sm font-bold text-green-800">Resolution: Refund</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setRefundMethod('razorpay')}
                  className={`py-2 px-3 rounded-lg border-2 text-[10px] font-bold uppercase tracking-wider transition-all ${refundMethod === 'razorpay' ? 'border-green-500 bg-green-100 text-green-700' : 'border-white bg-white/50 text-gray-400'}`}
                >
                  Razorpay Auto
                </button>
                <button 
                  onClick={() => setRefundMethod('manual')}
                  className={`py-2 px-3 rounded-lg border-2 text-[10px] font-bold uppercase tracking-wider transition-all ${refundMethod === 'manual' ? 'border-green-500 bg-green-100 text-green-700' : 'border-white bg-white/50 text-gray-400'}`}
                >
                  Manual Entry
                </button>
              </div>
              {refundMethod === 'manual' && (
                <input 
                  type="text" 
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  placeholder="Reference ID / UTR Number"
                  className="w-full bg-white border border-green-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500"
                />
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          {request.status === 'requested' && (
            <button
              onClick={onApprove}
              disabled={isPending}
              className="flex-1 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-bold hover:bg-purple-600 transition-all flex items-center justify-center gap-2"
            >
              {isPending && actionType === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Approve Request
            </button>
          )}
          {(request.status === 'approved' || request.status === 'pickup_scheduled') && (
            <button
              onClick={onReceived}
              disabled={isPending}
              className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
            >
              {isPending && actionType === 'received' ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
              Mark as Received
            </button>
          )}
          {request.status === 'item_received' && (
            <button
              onClick={() => onResolve({ refundMethod, manualReference: manualRef })}
              disabled={isPending}
              className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
            >
              {isPending && actionType === 'resolve' ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Complete {request.type === 'return' ? 'Refund' : 'Replacement'}
            </button>
          )}
          <button
            onClick={onReject}
            disabled={isPending}
            className="px-6 py-2.5 text-sm font-bold text-muted hover:text-red-500 transition-colors"
          >
            Reject
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
  const [cancelModal, setCancelModal] = useState<{ order: UIOrder; itemId?: string; itemTitle?: string } | null>(null);
  const [trackModal, setTrackModal] = useState<UIOrder | null>(null);
  const [dispatchModal, setDispatchModal] = useState<UIOrder | null>(null);
  const [refundModal, setRefundModal] = useState<UIOrder | null>(null);
  const [refundItemModal, setRefundItemModal] = useState<{ order: UIOrder; item: UIOrderItem } | null>(null);
  const [returnModal, setReturnModal] = useState<{ order: UIOrder, request: any } | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [actionType, setActionType] = useState<string | null>(null);

  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const sortModalRef = useRef<HTMLDivElement>(null);
  const filterModalRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  // Fetch orders from API
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['orders', activeTab, currentPage],
    queryFn: async () => {
      const status = activeTab === 'All order' ? undefined : STATUS_TAB_MAPPING[activeTab as Exclude<TabStatus, 'All order'>][0];
      const response = await orderApi.list({ page: currentPage, limit: 10, status });
      return response;
    },
  });

  // Transform API orders to UI format
  const uiOrders: UIOrder[] = (ordersData?.orders || []).map((order, index) => transformOrder(order, index));

  // Calculate KPI totals
  const totalOrders = ordersData?.pagination?.total || 0;

  // Mutations
  const dispatchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return await orderApi.dispatch(id, data);
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

  const refundMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await orderApi.refund(id, { reason });
    },
    onSuccess: () => {
      toast.success('Full refund processed successfully via Razorpay');
      setRefundModal(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    },
  });

  const refundItemMutation = useMutation({
    mutationFn: async ({ id, itemId, reason }: { id: string; itemId: string; reason: string }) => {
      return await orderApi.refundOrderItemAdmin(id, itemId, reason);
    },
    onSuccess: () => {
      toast.success('Item refund processed successfully via Razorpay');
      setRefundItemModal(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process item refund');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, itemId, reason }: { id: string; itemId?: string; reason: string }) => {
      if (itemId) {
        return await orderApi.cancelOrderItemAdmin(id, itemId, reason);
      }
      return await orderApi.cancelAdmin(id, reason);
    },
    onSuccess: (_, variables) => {
      toast.success(variables.itemId ? 'Item cancelled successfully' : 'Order cancelled successfully');
      setCancelModal(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel');
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
      toast.error(error.response?.data?.message || 'Failed to fetch tracking data');
    },
  });

  const invoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await orderApi.getInvoice(id);
    },
    onSuccess: (data) => {
      if (data?.invoiceUrl) {
        window.open(data.invoiceUrl, '_blank');
      } else {
        toast.error('Invoice URL not found');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate invoice');
    },
  });

  const returnApproveMutation = useMutation({
    mutationFn: async (id: string) => {
      setActionType('approve');
      return await returnApi.approve(id);
    },
    onSuccess: () => {
      toast.success('Return approved & Shiprocket Pickup Scheduled');
      setReturnModal(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve return');
    },
    onSettled: () => setActionType(null)
  });

  const returnReceivedMutation = useMutation({
    mutationFn: async (id: string) => {
      setActionType('received');
      return await returnApi.received(id);
    },
    onSuccess: () => {
      toast.success('Item marked as received in warehouse');
      setReturnModal(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark as received');
    },
    onSettled: () => setActionType(null)
  });

  const returnResolveMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      setActionType('resolve');
      return await returnApi.resolve(id, data);
    },
    onSuccess: (data: any, variables) => {
      const type = returnModal?.request?.type || 'return';
      toast.success(type === 'return' ? 'Refund processed successfully via Razorpay' : 'Replacement shipment created in Shiprocket');
      setReturnModal(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to resolve request');
    },
    onSettled: () => setActionType(null)
  });

  // Handlers
  const handleTrack = (order: UIOrder) => {
    setTrackModal(order);
    trackMutation.mutate(order.id);
  };

  const handleManageReturn = async (order: UIOrder, item: UIOrderItem) => {
    try {
      toast.loading('Fetching return details...', { id: 'return-fetch' });
      const request = await returnApi.getByItemId(item.id);
      toast.dismiss('return-fetch');
      
      if (!request) {
        toast.error('No return request found for this item');
        return;
      }
      
      setReturnModal({ order, request });
    } catch (error) {
      toast.dismiss('return-fetch');
      toast.error('Failed to load return details');
    }
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
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-400 mx-auto">
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
          <div className="relative flex-1 sm:min-w-60">
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
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-4">By Categories</h4>
                      <div className="relative mb-3">
                        <input
                          type="text"
                          placeholder="Search categories..."
                          value={searchCategory}
                          onChange={(e) => setSearchCategory(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:border-brand"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {filteredCategories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                            className={`px-3 py-1.5 rounded-lg text-left text-xs transition-all ${selectedCategory === cat ? 'bg-brand/10 text-brand-dark font-bold border border-brand/20' : 'bg-background text-muted hover:text-primary'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-4">By Brands</h4>
                      <div className="flex flex-wrap gap-2">
                        {brands.map(brand => (
                          <button
                            key={brand}
                            onClick={() => setSelectedBrand(selectedBrand === brand ? '' : brand)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${selectedBrand === brand ? 'bg-brand/10 text-brand-dark font-bold border border-brand/20' : 'bg-background text-muted hover:text-primary'}`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border flex gap-3">
                      <button
                        onClick={() => { setSelectedCategory(null); setSelectedBrand(''); }}
                        className="flex-1 py-2 text-xs font-bold text-muted hover:text-primary transition-colors"
                      >
                        Reset All
                      </button>
                      <button
                        onClick={() => setShowFilterModal(false)}
                        className="flex-1 py-2 bg-brand text-white rounded-lg text-xs font-bold hover:bg-brand-dark transition-colors"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
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
                  <button className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-background transition-colors">Newest First</button>
                  <button className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-background transition-colors">Oldest First</button>
                  <button className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-background transition-colors">Total: High to Low</button>
                  <button className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-background transition-colors">Total: Low to High</button>
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
                      
                      {/* Global Order Refund Action */}
                      {(order.statusRaw === 'cancelled' || order.statusRaw === 'returned') && order.payment.toLowerCase() === 'razorpay' && (
                        <div className="ml-4">
                          {order.paymentStatus === 'refunded' ? (
                            <div className="px-2 py-0.5 bg-green-500 text-white text-[8px] font-black uppercase tracking-tighter rounded shadow-sm flex items-center gap-1 w-fit">
                              <Check size={8} strokeWidth={4} /> REFUND COMPLETE
                            </div>
                          ) : (
                            <button 
                              onClick={() => setRefundModal(order)}
                              className="px-4 py-1.5 bg-[#FF6B6B] text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-1 shadow-sm"
                            >
                              <RefreshCw size={12} /> Refund Order
                            </button>
                          )}
                        </div>
                      )}
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
                          <div className="w-20 h-20 rounded-lg bg-background border border-border overflow-hidden shrink-0">
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
                          {item.itemStatus !== 'active' && (
                             <div className="flex flex-col gap-1">
                               <div className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-purple-50 text-purple-600 rounded inline-block w-fit">
                                  {item.itemStatus.replace(/_/g, ' ')}
                               </div>
                               {(item.itemStatus === 'cancelled' || item.itemStatus === 'returned') && order.payment.toLowerCase() === 'razorpay' && (
                                 <div className="mt-1">
                                   {(item.refundStatus === 'processed' || order.paymentStatus === 'refunded') ? (
                                     <div className="px-2 py-0.5 bg-green-500 text-white text-[8px] font-black uppercase tracking-tighter rounded shadow-sm flex items-center gap-1 w-fit">
                                       <Check size={8} strokeWidth={4} /> REFUND COMPLETE
                                     </div>
                                   ) : (
                                     <button
                                       onClick={() => setRefundItemModal({ order, item })}
                                       className="text-[9px] font-bold text-orange-500 hover:text-orange-600 underline underline-offset-2 flex items-center gap-1"
                                     >
                                       <RefreshCw size={10} /> Issue Partial Refund
                                     </button>
                                   )}
                                 </div>
                               )}
                             </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex lg:flex-col items-center lg:items-end gap-2">
                          {/* Item specific Return Management */}
                          {(item.itemStatus === 'return_requested' || item.itemStatus === 'replacement_requested' || item.itemStatus === 'returned' || item.itemStatus === 'replaced') && (
                             <button
                                onClick={() => handleManageReturn(order, item)}
                                className="w-full lg:w-28 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-bold hover:bg-purple-600 transition-colors flex items-center justify-center gap-1"
                              >
                                <RotateCcw size={12} /> Manage
                              </button>
                          )}

                          {/* Processing Actions */}
                          {order.statusRaw === 'processing' && item.itemStatus === 'active' && (
                            <>
                              <button
                                onClick={() => setDispatchModal(order)}
                                className="w-full lg:w-28 py-1.5 bg-[#6467F2] text-white rounded-lg text-xs font-bold hover:bg-[#5558e3] transition-colors flex items-center justify-center gap-1"
                              >
                                <Package size={12} /> Dispatch
                              </button>
                              <button
                                onClick={() => setCancelModal({ order, itemId: item.id, itemTitle: item.title })}
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
                              <button
                                onClick={() => setCancelModal({ order, itemId: item.id, itemTitle: item.title })}
                                className="w-full lg:w-28 py-1.5 bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20 rounded-lg text-xs font-bold hover:bg-[#FF6B6B]/20 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {/* Delivered Actions */}
                          {order.statusRaw === 'delivered' && (
                            <>
                              <button
                                onClick={() => invoiceMutation.mutate(order.id)}
                                disabled={invoiceMutation.isPending}
                                className="w-full lg:w-28 py-1.5 bg-[#4EA674] text-white rounded-lg text-xs font-bold hover:bg-[#3d8c60] transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                {invoiceMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                                Invoice
                              </button>
                            </>
                          )}

                          {/* Cancelled Actions - REMOVED redundant item-level buttons */}
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
      {refundModal && (
        <RefundModal
          order={refundModal}
          onClose={() => setRefundModal(null)}
          onConfirm={(reason) => refundMutation.mutate({ id: refundModal.id, reason })}
          isPending={refundMutation.isPending}
        />
      )}

      {refundItemModal && (
        <RefundItemModal
          order={refundItemModal.order}
          item={refundItemModal.item}
          onClose={() => setRefundItemModal(null)}
          onConfirm={(reason) => refundItemMutation.mutate({ 
            id: refundItemModal.order.id, 
            itemId: refundItemModal.item.id, 
            reason 
          })}
          isPending={refundItemMutation.isPending}
        />
      )}

      {cancelModal && (
        <CancelModal
          order={cancelModal.order}
          itemId={cancelModal.itemId}
          itemTitle={cancelModal.itemTitle}
          onClose={() => setCancelModal(null)}
          onConfirm={(reason) => cancelMutation.mutate({ 
            id: cancelModal.order.id, 
            itemId: cancelModal.itemId, 
            reason 
          })}
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
          onDispatch={(data) => dispatchMutation.mutate({ id: dispatchModal.id, data })}
          isPending={dispatchMutation.isPending}
        />
      )}

      {returnModal && (
        <ReturnManageModal
          order={returnModal.order}
          request={returnModal.request}
          onClose={() => setReturnModal(null)}
          onApprove={() => returnApproveMutation.mutate(returnModal.request._id)}
          onReject={() => {}}
          onReceived={() => returnReceivedMutation.mutate(returnModal.request._id)}
          onResolve={(data) => returnResolveMutation.mutate({ id: returnModal.request._id, data })}
          isPending={returnApproveMutation.isPending || returnReceivedMutation.isPending || returnResolveMutation.isPending}
          actionType={actionType}
        />
      )}
    </div>
  );
}
