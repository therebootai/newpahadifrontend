'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  X,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  ShoppingCart,
  Loader2
} from 'lucide-react';
import Pagination from '@/components/admin/Pagination';
import { orders as mockOrders, Order } from '@/lib/mock-data';
import { useUsers, useToggleUserStatus, User, useCustomers } from '@/lib/hooks/useUsers';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState('All Customers');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Advanced Filters
  const [location, setLocation] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  const sortModalRef = useRef<HTMLDivElement>(null);
  const filterModalRef = useRef<HTMLDivElement>(null);

  const limit = 10;
  
  const isActiveFilter = activeTab === 'Active' ? 'active' : activeTab === 'Blocked' ? 'inactive' : 'all';
  
  const { data, isLoading, isError } = useCustomers({
    page: currentPage,
    limit,
    search: debouncedSearch,
    isActive: isActiveFilter,
    location,
    fromDate,
    toDate,
    sortBy
  });

  const { data: countData } = useCustomers({ page: 1, limit: 1 });
  const toggleStatusMutation = useToggleUserStatus();

  // Close modals on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortModalRef.current && !sortModalRef.current.contains(event.target as Node)) setShowSortModal(false);
      if (filterModalRef.current && !filterModalRef.current.contains(event.target as Node)) setShowFilterModal(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewCustomer = (customer: User) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleToggleStatus = (customerId: string) => {
    toggleStatusMutation.mutate(customerId);
  };

  const customers = data?.users || [];
  const totalPages = data?.totalPages || 1;
  const totalCustomers = data?.total || 0;
  const overallTotal = countData?.total || 0;

  // Get orders for the selected customer (Still using mockOrders for now as there's no real orders hook yet)
  const customerOrders = selectedCustomer 
    ? mockOrders.filter(order => order.customerName === selectedCustomer.name)
    : [];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-[1600px] mx-auto">
      {/* Tabs and Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="flex items-center gap-1 bg-background p-1 rounded-lg overflow-x-auto w-full lg:w-auto scrollbar-hide">
          {['All Customers', 'Active', 'Blocked'].map((tab) => {
            const count = tab === 'All Customers' ? overallTotal : 
                          tab === 'Active' && activeTab === 'Active' ? totalCustomers :
                          tab === 'Blocked' && activeTab === 'Blocked' ? totalCustomers : null;
            
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all flex-1 lg:flex-none ${
                  activeTab === tab ? 'bg-surface text-brand-dark shadow-sm' : 'text-muted hover:text-primary'
                }`}
              >
                {tab} {count !== null && !isLoading && <span className="ml-1 opacity-60">({count})</span>}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:min-w-[240px]">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
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
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-primary">Filter Customers</h4>
                    <button onClick={() => setShowFilterModal(false)} className="text-muted hover:text-primary"><X size={18} /></button>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Location</label>
                      <select 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:outline-none focus:border-brand"
                      >
                        <option value="">All Locations</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Bangalore">Bangalore</option>
                        <option value="Pune">Pune</option>
                        <option value="Hyderabad">Hyderabad</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Registration Date</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="date" 
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="flex-1 bg-background border border-border rounded-lg p-2 text-xs focus:outline-none focus:border-brand" 
                        />
                        <span className="text-muted text-xs">to</span>
                        <input 
                          type="date" 
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="flex-1 bg-background border border-border rounded-lg p-2 text-xs focus:outline-none focus:border-brand" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button 
                      onClick={() => {
                        setLocation('');
                        setFromDate('');
                        setToDate('');
                        setShowFilterModal(false);
                      }}
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
                  <div className="px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-wider border-b border-border mb-1">Sort By</div>
                  {[
                    { label: 'Newest First', value: 'newest' },
                    { label: 'Oldest First', value: 'oldest' },
                    { label: 'Name: A-Z', value: 'name_asc' },
                    { label: 'Name: Z-A', value: 'name_desc' }
                  ].map((option) => (
                    <button 
                      key={option.value} 
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortModal(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sortBy === option.value ? 'bg-brand/10 text-brand-dark font-bold' : 'text-primary hover:bg-background'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden min-h-100">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <table className="w-full text-left border-collapse min-w-250">
            <thead className="bg-[#F2F9F4] border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider w-12">
                  <input type="checkbox" className="w-4 h-4 rounded border-border text-brand focus:ring-brand" />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Customer Name</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Phone Number</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Orders</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Total Spend</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted">
                    Failed to load customers. Please try again.
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-background transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="w-4 h-4 rounded border-border text-brand focus:ring-brand" />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-bold text-primary">{customer.name || 'No Name'}</div>
                        <div className="text-xs text-muted truncate max-w-[150px]">{customer.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-primary font-medium">{customer.phone}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-primary font-medium">{customer.city || customer.location || 'N/A'}</div>
                      <div className="text-xs text-muted">{customer.state || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-primary font-bold">
                      {customer.totalOrders || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-primary font-bold">
                      ₹{(customer.totalSpend || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Status Toggle */}
                        <button 
                          onClick={() => handleToggleStatus(customer.id)}
                          disabled={toggleStatusMutation.isPending && toggleStatusMutation.variables === customer.id}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                            customer.isActive ? 'bg-brand' : 'bg-[#d1d5db]'
                          }`}
                        >
                          {toggleStatusMutation.isPending && toggleStatusMutation.variables === customer.id ? (
                            <Loader2 className="h-2 w-2 animate-spin mx-auto text-white" />
                          ) : (
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                customer.isActive ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          )}
                        </button>
                        <span className={`text-xs font-bold ${customer.isActive ? 'text-brand-dark' : 'text-[#FF6B6B]'}`}>
                          {customer.isActive ? 'Active' : 'Blocked'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end">
                        <button 
                          onClick={() => handleViewCustomer(customer)}
                          className="p-2 text-brand-dark hover:bg-brand/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
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
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={(page) => setCurrentPage(page)} 
        />
      )}

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-border">
            
            {/* Left Side: Customer Info */}
            <div className="w-full md:w-1/3 bg-[#F9FAFB] border-r border-border p-8 overflow-y-auto">
              <div className="flex justify-between items-start mb-8 md:hidden">
                <h2 className="text-xl font-bold text-primary">Customer Details</h2>
                <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-background rounded-lg text-muted">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center mb-8">
                <h3 className="text-xl font-bold text-primary">{selectedCustomer.name || 'No Name'}</h3>
                <p className="text-sm text-muted mb-2">Customer ID: {selectedCustomer.id}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  selectedCustomer.isActive ? 'bg-brand/10 text-brand-dark' : 'bg-[#FF6B6B]/10 text-[#FF6B6B]'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedCustomer.isActive ? 'bg-brand' : 'bg-[#FF6B6B]'}`} />
                  {selectedCustomer.isActive ? 'Active' : 'Blocked'}
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-white p-4 rounded-xl border border-border/50 shadow-sm">
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">Contact Information</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-brand-dark shrink-0" />
                      <p className="text-sm font-medium text-primary truncate">{selectedCustomer.email || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-brand-dark shrink-0" />
                      <p className="text-sm font-medium text-primary">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-border/50 shadow-sm">
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">Account Info</p>
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-brand-dark shrink-0" />
                    <p className="text-sm font-medium text-primary">Joined {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="bg-brand/5 p-4 rounded-xl border border-brand/10 text-center">
                  <p className="text-[10px] text-brand-dark font-bold uppercase tracking-wider mb-1">Orders</p>
                  <p className="text-xl font-bold text-brand-dark">{selectedCustomer.totalOrders || 0}</p>
                </div>
                <div className="bg-brand/5 p-4 rounded-xl border border-brand/10 text-center">
                  <p className="text-[10px] text-brand-dark font-bold uppercase tracking-wider mb-1">Spent</p>
                  <p className="text-lg font-bold text-brand-dark truncate">₹{(selectedCustomer.totalSpend || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Right Side: Order History */}
            <div className="w-full md:w-2/3 p-8 flex flex-col overflow-hidden bg-surface">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-primary">Order History</h2>
                  <span className="px-2 py-0.5 bg-background border border-border rounded text-xs font-bold text-muted">
                    0
                  </span>
                </div>
                <button 
                  onClick={() => setShowDetailsModal(false)} 
                  className="p-1 hover:bg-background rounded-lg text-muted transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
                {/* For now keeping empty as we don't have user orders real hook */}
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-background/50 rounded-2xl border border-dashed border-border">
                  <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center text-muted mb-4 shadow-sm">
                    <ShoppingCart size={32} className="opacity-20" />
                  </div>
                  <h4 className="font-bold text-primary mb-1">No Orders Found</h4>
                  <p className="text-sm text-muted max-w-[240px]">This customer hasn&apos;t placed any orders in the system yet.</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-border flex justify-end">
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="px-8 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 active:scale-95"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
