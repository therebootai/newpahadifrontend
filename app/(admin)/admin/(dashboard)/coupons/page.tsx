'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Plus,
  X,
  Eye,
  Calendar,
  Ticket,
  Percent,
  CircleDollarSign,
  TrendingUp,
  Clock,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Pagination from '@/components/admin/Pagination';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { useCoupons, validateCouponForm, validateUpdateForm, CouponFormData, FormErrors } from '@/lib/hooks/useCoupons';
import { Coupon, getApiErrorMessage } from '@/lib/api/coupons';

const CODE_REGEX = /^[A-Z0-9_]+$/;

const initialFormData: CouponFormData = {
  code: '',
  type: 'percentage',
  value: '',
  minOrderValue: '',
  maxDiscount: '',
  expiresAt: '',
  userLimit: '1',
};

export default function CouponsPage() {
  const [activeTab, setActiveTab] = useState('All Coupons');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<CouponFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filterModalRef = useRef<HTMLDivElement>(null);
  const addModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);

  const { coupons, loading, error, pagination, fetchCoupons, createCoupon, updateCoupon, deleteCoupon } = useCoupons({
    page: currentPage,
    limit: 10,
  });

  const loadCoupons = useCallback(() => {
    fetchCoupons({ page: currentPage, limit: 10 });
  }, [fetchCoupons, currentPage]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterModalRef.current && !filterModalRef.current.contains(event.target as Node)) {
        setShowFilterModal(false);
      }
      if (addModalRef.current && !addModalRef.current.contains(event.target as Node)) {
        setShowAddModal(false);
      }
      if (editModalRef.current && !editModalRef.current.contains(event.target as Node)) {
        setShowEditModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setShowDetailsModal(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    const expiryDate = new Date(coupon.expiresAt);
    const formattedDate = expiryDate.toISOString().split('T')[0];
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      minOrderValue: coupon.minOrderValue?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      expiresAt: formattedDate,
      userLimit: coupon.userLimit?.toString() || '1',
    });
    setFormErrors({});
    setSubmitError(null);
    setShowEditModal(true);
  };

  const handleDeleteCoupon = (couponId: string) => {
    setShowDeleteConfirm(couponId);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    setActionLoading(showDeleteConfirm);
    try {
      await deleteCoupon(showDeleteConfirm);
      setShowDeleteConfirm(null);
      setSubmitSuccess('Coupon deleted successfully');
      loadCoupons();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleCouponStatus = async (couponId: string) => {
    if (!selectedCoupon) return;
    setActionLoading(couponId);
    try {
      await updateCoupon(couponId, { isActive: !selectedCoupon.isActive });
      setSubmitSuccess(selectedCoupon.isActive ? 'Coupon deactivated' : 'Coupon activated');
      loadCoupons();
      if (selectedCoupon) {
        const updated = coupons.find((c) => c._id === couponId);
        if (updated) setSelectedCoupon(updated);
      }
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleFormChange = (field: keyof CouponFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setSubmitError(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateCouponForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitError(null);
    setActionLoading('add');
    try {
      await createCoupon({
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: parseFloat(formData.value),
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : undefined,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        expiresAt: new Date(formData.expiresAt).toISOString(),
        userLimit: formData.userLimit ? parseInt(formData.userLimit, 10) : 1,
      });
      setShowAddModal(false);
      setFormData(initialFormData);
      setSubmitSuccess('Coupon created successfully');
      loadCoupons();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoupon) return;

    const errors = validateUpdateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitError(null);
    setActionLoading('edit');
    try {
      const updateData: Parameters<typeof updateCoupon>[1] = {};
      if (formData.code !== selectedCoupon.code) updateData.code = formData.code.toUpperCase();
      if (formData.type !== selectedCoupon.type) updateData.type = formData.type as 'percentage' | 'flat';
      if (parseFloat(formData.value) !== selectedCoupon.value) updateData.value = parseFloat(formData.value);
      if (formData.minOrderValue && parseFloat(formData.minOrderValue) !== selectedCoupon.minOrderValue) {
        updateData.minOrderValue = parseFloat(formData.minOrderValue);
      }
      if (formData.maxDiscount && parseFloat(formData.maxDiscount) !== selectedCoupon.maxDiscount) {
        updateData.maxDiscount = parseFloat(formData.maxDiscount);
      }
      if (formData.expiresAt) {
        const newExpiry = new Date(formData.expiresAt).toISOString();
        if (newExpiry !== selectedCoupon.expiresAt) updateData.expiresAt = newExpiry;
      }
      if (formData.userLimit && parseInt(formData.userLimit, 10) !== selectedCoupon.userLimit) {
        updateData.userLimit = parseInt(formData.userLimit, 10);
      }

      await updateCoupon(selectedCoupon._id, updateData);
      setShowEditModal(false);
      setFormData(initialFormData);
      setSubmitSuccess('Coupon updated successfully');
      loadCoupons();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon._id.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'All Coupons') return matchesSearch;
    if (activeTab === 'Active') return matchesSearch && coupon.isActive;
    if (activeTab === 'Expired') {
      const expiryDate = new Date(coupon.expiresAt);
      return matchesSearch && (!coupon.isActive || expiryDate < new Date());
    }
    return matchesSearch;
  });

  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => setSubmitSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-[1600px] mx-auto">
      {/* Success/Error Messages */}
      {submitSuccess && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
          <CheckCircle size={18} />
          {submitSuccess}
        </div>
      )}
      {submitError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
          <AlertCircle size={18} />
          {submitError}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Tabs and Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-surface p-4 rounded-xl border border-border">
        <div className="flex items-center gap-1 bg-background p-1 rounded-lg overflow-x-auto w-full lg:w-auto">
          {['All Coupons', 'Active', 'Expired'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all flex-1 lg:flex-none ${
                activeTab === tab ? 'bg-surface text-brand-dark shadow-sm' : 'text-muted hover:text-primary'
              }`}
            >
              {tab} {tab === 'All Coupons' && <span className="ml-1 opacity-60">({pagination?.total || coupons.length})</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:min-w-[240px]">
            <input
              type="text"
              placeholder="Search by code, name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setShowFilterModal(!showFilterModal)}
                className={`w-full sm:w-auto p-2 border border-border rounded-lg hover:bg-background transition-colors flex items-center justify-center gap-2 ${
                  showFilterModal ? 'bg-background text-brand-dark border-brand' : 'text-muted'
                }`}
              >
                <Filter size={20} />
                <span className="sm:hidden text-xs font-bold uppercase tracking-wider">Filter</span>
              </button>
              {showFilterModal && (
                <div
                  ref={filterModalRef}
                  className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[320px] bg-surface border border-border rounded-xl shadow-xl z-50 p-6 animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-primary">Filter Coupons</h4>
                    <button onClick={() => setShowFilterModal(false)} className="text-muted hover:text-primary">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Discount Type</label>
                      <select className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:outline-none focus:border-brand">
                        <option value="">All Types</option>
                        <option value="percentage">Percentage</option>
                        <option value="flat">Fixed Amount</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Usage Range</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:outline-none focus:border-brand"
                        />
                        <span className="text-muted text-xs">to</span>
                        <input
                          type="number"
                          placeholder="Max"
                          className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:outline-none focus:border-brand"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Quick Filters</label>
                      <div className="flex flex-wrap gap-2">
                        {['Most Used', 'Expiring Soon', 'Highest Discount'].map((filter) => (
                          <button
                            key={filter}
                            className="px-3 py-1.5 rounded-full border border-border text-[10px] font-bold text-muted hover:border-brand hover:text-brand-dark transition-all"
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={() => setShowFilterModal(false)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium border border-border hover:bg-background transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setShowFilterModal(false)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand-dark transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setFormData(initialFormData);
                setFormErrors({});
                setSubmitError(null);
                setShowAddModal(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-all whitespace-nowrap"
            >
              <Plus size={18} />
              Add Coupon
            </button>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-[#F2F9F4] border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">
                  <input type="checkbox" className="w-4 h-4 rounded border-border text-brand focus:ring-brand" />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Campaign Details</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Discount</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Min Purchase</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Usage</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Validity Window</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-brand" size={32} />
                    <p className="mt-2 text-sm text-muted">Loading coupons...</p>
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Ticket className="mx-auto text-muted/50" size={48} />
                    <p className="mt-2 text-sm text-muted">No coupons found</p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-background transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="w-4 h-4 rounded border-border text-brand focus:ring-brand" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-sm font-bold text-primary group-hover:text-brand-dark transition-colors">
                          {coupon.name || coupon.code}
                        </div>
                        <div className="text-[11px] text-muted font-bold tracking-tight bg-background border border-border px-1.5 py-0.5 rounded w-fit">
                          {coupon.code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm font-bold text-primary">
                        {coupon.type === 'percentage' ? (
                          <>
                            <span>{coupon.value}% Off</span>
                          </>
                        ) : (
                          <>
                            <span>₹{coupon.value} Off</span>
                          </>
                        )}
                      </div>
                      {coupon.maxDiscount > 0 && (
                        <div className="text-[10px] text-muted font-medium italic">Max: ₹{coupon.maxDiscount}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-primary font-medium">₹{coupon.minOrderValue.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 w-24">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-primary">{coupon.usageCount || 0}</span>
                          <span className="text-muted">{coupon.userLimit || '∞'}</span>
                        </div>
                        <div className="h-1.5 w-full bg-background border border-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand rounded-full transition-all duration-500"
                            style={{
                              width: `${coupon.userLimit ? (coupon.usageCount / coupon.userLimit) * 100 : 10}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs font-medium text-muted">
                        <div className="flex items-center gap-1.5">
                          <span className="w-8 uppercase text-[9px] font-bold text-muted/60">From</span>
                          <span>{new Date(coupon.startsAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-primary">
                          <span className="w-8 uppercase text-[9px] font-bold text-muted/60">To</span>
                          <span>{new Date(coupon.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          coupon.isActive ? 'bg-brand/10 text-brand-dark' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${coupon.isActive ? 'bg-brand' : 'bg-gray-400'}`} />
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewCoupon(coupon)}
                          className="p-1.5 text-brand-dark hover:bg-brand/10 rounded-lg transition-colors border border-transparent hover:border-brand/20"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditCoupon(coupon)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                          title="Edit Coupon"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon._id)}
                          className="p-1.5 text-[#FF6B6B] hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                          title="Delete Coupon"
                        >
                          {actionLoading === coupon._id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={pagination.totalPages} onPageChange={(page) => setCurrentPage(page)} />
      )}

      {/* Add Coupon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div ref={addModalRef} className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h3 className="text-lg font-bold text-primary">Add New Coupon</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-background rounded-lg transition-colors text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                  <AlertCircle size={16} />
                  {submitError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Coupon Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleFormChange('code', e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10"
                  className={`w-full bg-background border rounded-lg p-2.5 text-sm focus:outline-none transition-all ${
                    formErrors.code ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'
                  }`}
                />
                {formErrors.code && <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>}
                <p className="text-[10px] text-muted mt-1">Only uppercase letters, numbers, and underscores allowed</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Discount Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    className={`w-full bg-background border rounded-lg p-2.5 text-sm focus:outline-none transition-all ${
                      formErrors.type ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'
                    }`}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Fixed Amount</option>
                  </select>
                  {formErrors.type && <p className="text-xs text-red-500 mt-1">{formErrors.type}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
                    {formData.type === 'percentage' ? 'Discount % *' : 'Discount Amount *'}
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => handleFormChange('value', e.target.value)}
                    placeholder={formData.type === 'percentage' ? 'e.g. 10' : 'e.g. 100'}
                    min="1"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    className={`w-full bg-background border rounded-lg p-2.5 text-sm focus:outline-none transition-all ${
                      formErrors.value ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'
                    }`}
                  />
                  {formErrors.value && <p className="text-xs text-red-500 mt-1">{formErrors.value}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Min. Order Value</label>
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) => handleFormChange('minOrderValue', e.target.value)}
                    placeholder="e.g. 500"
                    min="0"
                    className={`w-full bg-background border rounded-lg p-2.5 text-sm focus:outline-none transition-all ${
                      formErrors.minOrderValue ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'
                    }`}
                  />
                  {formErrors.minOrderValue && <p className="text-xs text-red-500 mt-1">{formErrors.minOrderValue}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
                    Max. Discount {formData.type === 'percentage' && '(Optional)'}
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => handleFormChange('maxDiscount', e.target.value)}
                    placeholder="e.g. 200"
                    min="0"
                    className={`w-full bg-background border rounded-lg p-2.5 text-sm focus:outline-none transition-all ${
                      formErrors.maxDiscount ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'
                    }`}
                  />
                  {formErrors.maxDiscount && <p className="text-xs text-red-500 mt-1">{formErrors.maxDiscount}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Expires On *</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => handleFormChange('expiresAt', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full bg-background border rounded-lg p-2.5 text-sm focus:outline-none transition-all ${
                      formErrors.expiresAt ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'
                    }`}
                  />
                  {formErrors.expiresAt && <p className="text-xs text-red-500 mt-1">{formErrors.expiresAt}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">User Limit</label>
                  <input
                    type="number"
                    value={formData.userLimit}
                    onChange={(e) => handleFormChange('userLimit', e.target.value)}
                    placeholder="e.g. 1"
                    min="0"
                    className={`w-full bg-background border rounded-lg p-2.5 text-sm focus:outline-none transition-all ${
                      formErrors.userLimit ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'
                    }`}
                  />
                  {formErrors.userLimit && <p className="text-xs text-red-500 mt-1">{formErrors.userLimit}</p>}
                  <p className="text-[10px] text-muted mt-1">0 = unlimited</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'add'}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading === 'add' ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Creating...
                    </>
                  ) : (
                    'Create Coupon'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Coupon Modal */}
      {showEditModal && selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div ref={editModalRef} className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h3 className="text-lg font-bold text-primary">Edit Coupon</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-background rounded-lg transition-colors text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                  <AlertCircle size={16} />
                  {submitError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Coupon Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleFormChange('code', e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10"
                  className={`w-full bg-background border rounded-lg p-2.5 text-sm focus:outline-none transition-all ${
                    formErrors.code ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'
                  }`}
                />
                {formErrors.code && <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Discount Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    className={`w-full bg-background border rounded-lg p-2.5 text-sm focus:outline-none transition-all ${
                      formErrors.type ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'
                    }`}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Discount Value</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => handleFormChange('value', e.target.value)}
                    placeholder={formData.type === 'percentage' ? 'e.g. 10' : 'e.g. 100'}
                    min="1"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    className={`w-full bg-background border rounded-lg p-2.5 text-sm focus:outline-none transition-all ${
                      formErrors.value ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'
                    }`}
                  />
                  {formErrors.value && <p className="text-xs text-red-500 mt-1">{formErrors.value}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Min. Order Value</label>
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) => handleFormChange('minOrderValue', e.target.value)}
                    placeholder="e.g. 500"
                    min="0"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Max. Discount</label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => handleFormChange('maxDiscount', e.target.value)}
                    placeholder="e.g. 200"
                    min="0"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Expires On</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => handleFormChange('expiresAt', e.target.value)}
                    className={`w-full bg-background border rounded-lg p-2.5 text-sm focus:outline-none transition-all ${
                      formErrors.expiresAt ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'
                    }`}
                  />
                  {formErrors.expiresAt && <p className="text-xs text-red-500 mt-1">{formErrors.expiresAt}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">User Limit</label>
                  <input
                    type="number"
                    value={formData.userLimit}
                    onChange={(e) => handleFormChange('userLimit', e.target.value)}
                    placeholder="e.g. 1"
                    min="0"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'edit'}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading === 'edit' ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Details Modal */}
      {showDetailsModal && selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-border animate-in slide-in-from-bottom-4 duration-300">
            <div className="relative h-32 bg-brand/10 overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-primary) 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              ></div>
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl text-primary transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="absolute -bottom-10 left-8">
                <div className="w-20 h-20 rounded-2xl bg-white border border-border shadow-xl flex items-center justify-center text-brand-dark">
                  <Ticket size={40} />
                </div>
              </div>
            </div>

            <div className="p-8 pt-14">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-1">{selectedCoupon.name || selectedCoupon.code}</h2>
                  <div className="text-xs font-bold text-brand-dark bg-brand/5 border border-brand/10 px-2 py-1 rounded w-fit uppercase tracking-widest">
                    {selectedCoupon.code}
                  </div>
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedCoupon.isActive ? 'bg-brand/10 text-brand-dark' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedCoupon.isActive ? 'bg-brand' : 'bg-gray-400'}`} />
                  {selectedCoupon.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-background/50 border border-border rounded-xl p-4">
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">Discount Details</p>
                  <div className="flex items-center gap-2">
                    {selectedCoupon.type === 'percentage' ? (
                      <Percent size={18} className="text-brand-dark" />
                    ) : (
                      <CircleDollarSign size={18} className="text-brand-dark" />
                    )}
                    <span className="text-lg font-bold text-primary">
                      {selectedCoupon.type === 'percentage'
                        ? `${selectedCoupon.value}% Off`
                        : `₹${selectedCoupon.value} Off`}
                    </span>
                  </div>
                  {selectedCoupon.maxDiscount > 0 && (
                    <p className="text-xs text-muted mt-1 font-medium italic">Up to ₹{selectedCoupon.maxDiscount}</p>
                  )}
                </div>

                <div className="bg-background/50 border border-border rounded-xl p-4">
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">Requirement</p>
                  <div className="flex items-center gap-2">
                    <CircleDollarSign size={18} className="text-brand-dark" />
                    <span className="text-lg font-bold text-primary">Min. ₹{selectedCoupon.minOrderValue}</span>
                  </div>
                  <p className="text-xs text-muted mt-1 font-medium">Order value needed</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary">Current Usage</p>
                      <p className="text-sm font-medium text-muted">{selectedCoupon.usageCount || 0} times used</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary">Limit</p>
                    <p className="text-sm font-medium text-muted">{selectedCoupon.userLimit || 'Unlimited'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary">Validity Window</p>
                      <p className="text-sm font-medium text-muted">
                        {new Date(selectedCoupon.startsAt).toLocaleDateString()} to{' '}
                        {new Date(selectedCoupon.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleCouponStatus(selectedCoupon._id)}
                      disabled={actionLoading === selectedCoupon._id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedCoupon.isActive
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-brand/10 text-brand-dark hover:bg-brand/20'
                      }`}
                    >
                      {actionLoading === selectedCoupon._id ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : selectedCoupon.isActive ? (
                        'Deactivate'
                      ) : (
                        'Activate'
                      )}
                    </button>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FF6B6B]/5 border border-[#FF6B6B]/10 rounded-lg">
                      <Clock size={14} className="text-[#FF6B6B]" />
                      <span className="text-[10px] font-bold text-[#FF6B6B]">
                        Ends in {Math.ceil((new Date(selectedCoupon.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} Days
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditCoupon(selectedCoupon);
                  }}
                  className="flex-1 py-3 bg-background border border-border rounded-xl text-sm font-bold text-primary hover:bg-surface hover:border-brand transition-all"
                >
                  Edit Coupon
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Coupon?"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
      />
    </div>
  );
}