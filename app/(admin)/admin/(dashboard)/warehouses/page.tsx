'use client';

import { useState } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  Edit, 
  Warehouse as WarehouseIcon,
  Phone,
  Mail,
  MapPin,
  User,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import Pagination from '@/components/admin/Pagination';
import { 
  useWarehouses, 
  useCreateWarehouse, 
  useUpdateWarehouse, 
  useSyncWarehouses,
  Warehouse 
} from '@/lib/hooks/useWarehouses';
import { Skeleton } from '@/components/ui/Skeleton';

export default function WarehousesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // Queries & Mutations
  const { data: warehouses, isLoading, isError, refetch } = useWarehouses();
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const syncMutation = useSyncWarehouses();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    pickupLocation: '',
    email: '',
    phone: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    pinCode: '',
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      pickupLocation: warehouse.pickupLocation,
      email: warehouse.email,
      phone: warehouse.phone,
      address: warehouse.address,
      address2: warehouse.address2 || '',
      city: warehouse.city,
      state: warehouse.state,
      pinCode: warehouse.pinCode,
    });
    setServerError(null);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingWarehouse(null);
    setFormData({
      name: '',
      pickupLocation: '',
      email: '',
      phone: '',
      address: '',
      address2: '',
      city: '',
      state: '',
      pinCode: '',
    });
    setServerError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Basic validation for pickupLocation (Shiprocket requirement)
    if (!editingWarehouse && !/^[a-zA-Z0-9_-]+$/.test(formData.pickupLocation)) {
      setServerError('Pickup location can only contain letters, numbers, underscores, and hyphens (no spaces).');
      return;
    }

    try {
      if (editingWarehouse) {
        // Only send fields allowed for update (Backend restricts pickupLocation, city, state, pinCode)
        const updateData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          address2: formData.address2,
        };
        await updateMutation.mutateAsync({ id: editingWarehouse.id, data: updateData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setShowModal(false);
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Failed to save warehouse');
    }
  };

  const filteredWarehouses = (warehouses || []).filter(wh => 
    wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wh.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wh.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(filteredWarehouses.length / ITEMS_PER_PAGE);
  const currentWarehouses = filteredWarehouses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Warehouse Management</h1>
          <p className="text-muted text-sm mt-1">Manage your storage locations and distribution hubs.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <button 
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-border text-primary rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 w-full sm:w-auto"
            title="Sync with Shiprocket"
          >
            <RefreshCw size={18} className={syncMutation.isPending ? 'animate-spin text-brand' : 'text-muted'} />
            Sync Locations
          </button>
          <button 
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 active:scale-95 w-full sm:w-auto"
          >
            <Plus size={18} />
            Add Warehouse
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-border bg-surface flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <input
              type="text"
              placeholder="Search warehouses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          </div>
          <div className="text-xs font-medium text-muted w-full lg:w-auto text-center lg:text-right">
            Showing {filteredWarehouses.length} warehouses
          </div>
        </div>

        {/* Warehouses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#F2F9F4] border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Warehouse Info</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Contact Details</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Verification</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-12 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-red-500">
                    <AlertCircle className="mx-auto mb-2" />
                    <p className="font-bold">Failed to load warehouses</p>
                    <button onClick={() => refetch()} className="text-xs underline">Retry</button>
                  </td>
                </tr>
              ) : currentWarehouses.length > 0 ? (
                currentWarehouses.map(wh => (
                  <tr key={wh.id} className="hover:bg-background transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-dark shrink-0 mt-0.5">
                          <WarehouseIcon size={20} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-primary">{wh.name}</div>
                          <div className="text-[10px] text-muted font-medium uppercase tracking-wider">{wh.pickupLocation}</div>
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <MapPin size={12} className="text-brand" />
                            {wh.city}, {wh.state}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-muted">
                            <Phone size={12} />
                            {wh.phone}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted">
                            <Mail size={12} />
                            {wh.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {wh.isVerified ? (
                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase tracking-wider">
                          <ShieldCheck size={14} />
                          Verified
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-600 font-bold text-[10px] uppercase tracking-wider">
                            <ShieldAlert size={14} />
                            Pending
                          </div>
                          <p className="text-[9px] text-muted leading-tight max-w-[120px]">
                            Please verify this location in your <a href="https://app.shiprocket.in/seller/settings/company-setup/pickup-addresses" target="_blank" rel="noopener noreferrer" className="text-brand underline hover:text-brand-dark">Shiprocket Dashboard</a>.
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {wh.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand/10 text-brand uppercase tracking-wider border border-brand/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wider border border-gray-200">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(wh)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Warehouse"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted">
                    No warehouses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={(page) => setCurrentPage(page)} 
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-border animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-border flex justify-between items-center bg-[#F9FAFB] shrink-0">
              <h2 className="text-lg font-bold text-primary">
                {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-background rounded-lg text-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                {serverError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} />
                    {serverError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block">Warehouse Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Primary Hub Mumbai"
                      required
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block">Pickup Location ID (Shiprocket)</label>
                    <input 
                      type="text" 
                      value={formData.pickupLocation}
                      onChange={(e) => setFormData({...formData, pickupLocation: e.target.value})}
                      placeholder="PRIMARY_WH"
                      required
                      disabled={!!editingWarehouse}
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all disabled:opacity-60 disabled:bg-gray-50"
                    />
                    {editingWarehouse && <p className="text-[10px] text-muted">Core Shiprocket fields cannot be changed.</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block">Email</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="warehouse@mscliq.com"
                      required
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block">Phone</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="9876543210"
                      required
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block">Address Line 1</label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Street address, P.O. box, company name"
                      required
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block">Address Line 2 (Optional)</label>
                    <input 
                      type="text" 
                      value={formData.address2}
                      onChange={(e) => setFormData({...formData, address2: e.target.value})}
                      placeholder="Apartment, suite, unit, building, floor, etc."
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block">City</label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="Mumbai"
                      required
                      disabled={!!editingWarehouse}
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all disabled:opacity-60 disabled:bg-gray-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block">State</label>
                    <input 
                      type="text" 
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      placeholder="Maharashtra"
                      required
                      disabled={!!editingWarehouse}
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all disabled:opacity-60 disabled:bg-gray-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block">Pincode</label>
                    <input 
                      type="text" 
                      value={formData.pinCode}
                      onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
                      placeholder="400001"
                      required
                      disabled={!!editingWarehouse}
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all disabled:opacity-60 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border bg-[#F9FAFB] flex gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-border rounded-xl text-sm font-bold text-primary hover:bg-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin" size={18} /> : (editingWarehouse ? 'Update Warehouse' : 'Create Warehouse')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
