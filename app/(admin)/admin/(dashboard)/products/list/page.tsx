'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Tag,
  Package,
  Building2,
  CheckCircle2,
  AlertCircle,
  Settings2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  IndianRupee,
  Box,
  DollarSign,
  Filter,
  ArrowUpDown,
  X,
  Warehouse as WarehouseIcon,
  Loader2,
  Check,
} from 'lucide-react';
import Pagination from '@/components/admin/Pagination';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { 
  useProducts, 
  useDeleteProduct, 
  useToggleProductStatus,
  Product
} from '@/lib/hooks/useProducts';
import { useBrands } from '@/lib/hooks/useBrands';
import { useCategories } from '@/lib/hooks/useCategories';
import { useWarehouses } from '@/lib/hooks/useWarehouses';
import { useVariants, useToggleVariantStatus, useUpdateVariant, Variant } from '@/lib/hooks/useVariants';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { toast } from 'sonner';

export default function ProductManagementPage() {
  const router = useRouter();

  // List State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [quickEditData, setQuickEditData] = useState<{ variant: Variant, productId: string } | null>(null);

  // Filter & Sort State
  const [filters, setFilters] = useState({
    isPublished: 'all' as 'all' | 'true' | 'false',
    isActive: 'all' as 'all' | 'true' | 'false',
    brandId: 'all',
    categoryId: 'all',
    warehouseId: 'all',
    sort: 'newest' as 'newest' | 'oldest'
  });

  // Queries
  const { data, isLoading, isError, refetch } = useProducts(currentPage, 10, debouncedSearch, filters);
  const deleteMutation = useDeleteProduct();
  const toggleMutation = useToggleProductStatus();

  const handleEdit = (product: Product) => {
    router.push(`/admin/products/${product.id}/edit`);
  };

  const handleAdd = () => {
    router.push('/admin/products/add');
  };

  const products = data?.products || [];
  const totalPages = data?.pages || 1;
  const totalResults = data?.total || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <ProductList 
        products={products}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filters={filters}
        setFilters={setFilters}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id: string) => setShowDeleteConfirm(id)}
        onToggle={(id: string, isActive: boolean) => toggleMutation.mutate({ id, isActive })}
        onQuickEdit={(variant: Variant, productId: string) => setQuickEditData({ variant, productId })}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalResults={totalResults}
        isLoading={isLoading}
        isError={isError}
        refetch={refetch}
      />
      
      {quickEditData && (
        <QuickPriceModal 
          variant={quickEditData.variant} 
          productId={quickEditData.productId}
          onClose={() => setQuickEditData(null)} 
        />
      )}

      <DeleteConfirmModal 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={async () => {
          if (showDeleteConfirm) {
            const loadingId = toast.loading('Deleting product...');
            try {
              await deleteMutation.mutateAsync(showDeleteConfirm);
              toast.success('Product deleted successfully', { id: loadingId });
              setShowDeleteConfirm(null);
            } catch (error: any) {
              const message = error.response?.data?.message || 'Failed to delete product';
              toast.error(message, { id: loadingId });
            }
          }
        }}
        title="Delete Product?"
        message="Are you sure you want to delete this product? All its variants and associated data will be permanently removed."
      />
    </div>
  );
}

// ==========================================
// QUICK PRICE EDIT MODAL
// ==========================================
function QuickPriceModal({ variant, onClose, productId }: { variant: Variant, onClose: () => void, productId: string }) {
  const [formData, setFormData] = useState({
    price: String(variant.price),
    mrp: String(variant.mrp),
    discount: String(variant.attributes?.discount || '0'),
    discountType: (variant.attributes?.discountType as 'percentage' | 'flat') || 'percentage'
  });
  const updateVariantMutation = useUpdateVariant();

  const handlePricingChange = (type: 'mrp' | 'price' | 'discount' | 'discountType', value: string) => {
    setFormData(prev => {
      const mrp = type === 'mrp' ? Math.round(parseFloat(value)) : Math.round(parseFloat(prev.mrp));
      const price = type === 'price' ? Math.round(parseFloat(value)) : Math.round(parseFloat(prev.price));
      const discount = type === 'discount' ? Math.round(parseFloat(value)) : Math.round(parseFloat(prev.discount));
      const discType = type === 'discountType' ? (value as 'percentage' | 'flat') : prev.discountType;

      if (type === 'discountType') {
        if (isNaN(mrp) || isNaN(price)) return { ...prev, discountType: discType };
        let newDiscount = 0;
        if (discType === 'percentage') {
          newDiscount = Math.round(((mrp - price) / mrp) * 100);
        } else {
          newDiscount = Math.round(mrp - price);
        }
        return { ...prev, discountType: discType, discount: isNaN(newDiscount) ? '0' : newDiscount.toString() };
      }

      if (isNaN(mrp)) return { ...prev, [type]: value };

      if (type === 'mrp') {
        const roundedMrp = Math.round(parseFloat(value));
        if (!isNaN(price)) {
          const d = Math.round(((roundedMrp - price) / roundedMrp) * 100);
          return { ...prev, mrp: isNaN(roundedMrp) ? value : roundedMrp.toString(), discount: isNaN(d) ? '0' : d.toString(), discountType: 'percentage' };
        }
        return { ...prev, mrp: isNaN(roundedMrp) ? value : roundedMrp.toString() };
      }

      if (type === 'price') {
        const roundedPrice = Math.round(parseFloat(value));
        const d = Math.round(((mrp - roundedPrice) / mrp) * 100);
        return { ...prev, price: isNaN(roundedPrice) ? value : roundedPrice.toString(), discount: isNaN(d) ? '0' : d.toString(), discountType: 'percentage' };
      }

      if (type === 'discount') {
        const roundedDiscount = Math.round(parseFloat(value));
        if (isNaN(roundedDiscount)) return { ...prev, discount: value, price: '' };
        let newPrice = 0;
        if (discType === 'percentage') {
          newPrice = Math.floor(mrp - (mrp * (roundedDiscount / 100)));
        } else {
          newPrice = Math.floor(mrp - roundedDiscount);
        }
        return { ...prev, discount: isNaN(roundedDiscount) ? value : roundedDiscount.toString(), price: Math.max(0, newPrice).toString() };
      }

      return { ...prev, [type]: value };
    });
  };

  const handleSave = async () => {
    const loadingId = toast.loading('Updating price...');
    try {
      const vFormData = new FormData();
      vFormData.append('price', formData.price);
      vFormData.append('mrp', formData.mrp);
      
      const updatedAttributes = {
        ...variant.attributes,
        discount: formData.discount,
        discountType: formData.discountType
      };
      vFormData.append('attributes', JSON.stringify(updatedAttributes));
      vFormData.append('productId', productId);

      await updateVariantMutation.mutateAsync({ id: variant.id, formData: vFormData });
      toast.success('Price updated successfully', { id: loadingId });
      onClose();
    } catch (error) {
      toast.error('Failed to update price', { id: loadingId });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <DollarSign size={18} className="text-brand" /> Quick Edit Price
          </h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-5">
           <div>
             <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 ml-1">Market Price (MRP)</label>
             <div className="flex items-center">
                <span className="bg-gray-100 border border-r-0 border-gray-200 px-3 py-2.5 rounded-l-lg text-sm text-gray-500 font-bold">₹</span>
                <input 
                  type="number" 
                  value={formData.mrp}
                  onChange={(e) => handlePricingChange('mrp', e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-r-lg px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-brand transition-colors"
                />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 ml-1">Discount</label>
                <div className="flex">
                  <input 
                    type="number" 
                    value={formData.discount}
                    onChange={(e) => handlePricingChange('discount', e.target.value)}
                    className="w-full bg-white border border-r-0 border-gray-200 rounded-l-lg px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-brand transition-colors"
                  />
                  <select 
                    value={formData.discountType}
                    onChange={(e) => handlePricingChange('discountType', e.target.value)}
                    className="bg-gray-100 border border-gray-200 rounded-r-lg px-2 text-xs font-bold text-gray-600 focus:outline-none"
                  >
                    <option value="percentage">%</option>
                    <option value="flat">₹</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 ml-1">Sale Price</label>
                <div className="flex items-center">
                  <span className="bg-gray-100 border border-r-0 border-gray-200 px-3 py-2.5 rounded-l-lg text-sm text-gray-500 font-bold">₹</span>
                  <input 
                    type="number" 
                    value={formData.price}
                    onChange={(e) => handlePricingChange('price', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-r-lg px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-brand transition-colors text-brand"
                  />
                </div>
              </div>
           </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted hover:text-primary transition-colors">Cancel</button>
           <button 
            onClick={handleSave}
            disabled={updateVariantMutation.isPending}
            className="px-6 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center gap-2"
           >
             {updateVariantMutation.isPending && <Loader2 size={16} className="animate-spin" />}
             Update Price
           </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// INDIVIDUAL PRODUCT ROW COMPONENT
// ==========================================
function ProductRow({ product, onEdit, onDelete, onToggle, onQuickEdit }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: variants, isLoading: isVariantsLoading } = useVariants(isExpanded ? product.id : '');
  const toggleVariantMutation = useToggleVariantStatus();

  const categoryName = product.categoryId?.name || 'Category';
  const brandName = product.brandId?.name || 'Brand';

  return (
    <>
      <tr className={`hover:bg-gray-50/50 transition-all group ${isExpanded ? 'bg-[#F2F9F4]/30' : ''}`}>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsExpanded(!isExpanded)}
               className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'bg-brand text-white' : 'hover:bg-gray-100 text-muted'}`}
             >
               {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </button>
             <div className="flex items-center gap-4">
               <div className="w-14 h-14 rounded-xl bg-white border border-border overflow-hidden shrink-0 p-2 shadow-sm">
                 <img src={product.coverImage?.url || '/placeholder.png'} alt="" className="w-full h-full object-contain" />
               </div>
               <div className="max-w-[240px]">
                 <div className="text-sm font-bold text-primary truncate" title={product.title}>{product.title}</div>
                 <div className="flex items-center gap-2 mt-1">
                   <span className="text-[10px] text-muted font-bold uppercase tracking-widest">{product.id}</span>
                   {product.isPublished ? (
                     <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">LIVE</span>
                   ) : (
                     <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-center">Not Published yet</span>
                   )}
                 </div>
               </div>
             </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
              <Tag size={12} className="text-brand" />
              {categoryName}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
              <Building2 size={12} />
              {brandName}
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
           <button
            onClick={() => onToggle(product.id, !product.isActive)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              product.isActive ? 'bg-brand' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                product.isActive ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-2 transition-opacity">
            <button 
              onClick={() => onEdit(product)}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
              title="Edit Product"
            >
              <Edit size={18} />
            </button>
            <button 
              onClick={() => onDelete(product.id)}
              className="p-2 text-[#FF6B6B] hover:bg-red-50 rounded-lg transition-all"
              title="Delete Product"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Variants View */}
      {isExpanded && (
        <tr className="bg-gray-50/50">
          <td colSpan={4} className="px-6 py-0 border-b border-border">
            <div className="py-6 pl-12 pr-6 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-brand" />
                  <h4 className="text-sm font-bold text-primary">Product Variants</h4>
                  <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full font-bold">
                    {variants?.length || 0} Total
                  </span>
                </div>
                <button 
                  onClick={() => onEdit(product)}
                  className="text-xs text-brand font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} /> Add/Manage Variants
                </button>
              </div>

              {isVariantsLoading ? (
                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-1/6" />
                    </div>
                    <Skeleton className="h-4 w-1/5" />
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-4 w-1/5" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              ) : variants && variants.length > 0 ? (
                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">Variant Info</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">Specifications</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">Inventory</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">Pricing</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {variants.map((v: Variant) => {
                        const discount = v.attributes?.discount || '0';
                        const discountType = v.attributes?.discountType || 'percentage';
                        const hasDiscount = discount !== '0';

                        return (
                          <tr key={v.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg border border-border bg-white p-1 overflow-hidden shrink-0">
                                  <img src={v.coverImage?.url || product.coverImage?.url} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-primary">{v.title}</div>
                                  <div className="text-[10px] text-brand font-mono uppercase mt-0.5">{v.sku}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(v.attributes || {}).map(([key, value]) => {
                                  if (['discount', 'discountType', 'type'].includes(key)) return null;
                                  return (
                                    <span key={key} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium border border-gray-200">
                                      {key}: {value}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Box size={14} className={v.stocks > 0 ? 'text-brand' : 'text-red-400'} />
                                <span className={`text-xs font-bold ${v.stocks > 0 ? 'text-primary' : 'text-red-500'}`}>
                                  {v.stocks} in stock
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-primary flex items-center">
                                    <IndianRupee size={10} /> {v.price.toLocaleString()}
                                  </span>
                                  {hasDiscount && (
                                    <span className="text-[10px] text-muted line-through">
                                      ₹{v.mrp.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                {hasDiscount && (
                                  <div className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-orange-100">
                                    {discountType === 'percentage' ? `${discount}% OFF` : `₹${discount} OFF`}
                                  </div>
                                )}
                                <button 
                                  onClick={() => onQuickEdit(v, product.id)}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors ml-auto"
                                  title="Quick Edit Price"
                                >
                                  <Edit size={14} />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                               <button
                                  onClick={() => toggleVariantMutation.mutate({ id: v.id, productId: product.id })}
                                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${
                                    v.isActive ? 'bg-brand' : 'bg-gray-300'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                                      v.isActive ? 'translate-x-4' : 'translate-x-0.5'
                                    }`}
                                  />
                                </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 bg-white rounded-xl border border-dashed border-border">
                  <Layers className="text-muted mb-2" size={24} />
                  <p className="text-xs text-muted font-medium">No variants found for this product.</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ==========================================
// LIST VIEW COMPONENT
// ==========================================
function ProductList({ 
  products, searchQuery, setSearchQuery, filters, setFilters, onAdd, onEdit, onDelete, onToggle, onQuickEdit,
  currentPage, totalPages, onPageChange, totalResults, isLoading, isError, refetch
}: any) {
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: warehouses } = useWarehouses(true);
  
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const filterModalRef = useRef<HTMLDivElement>(null);
  const sortModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterModalRef.current && !filterModalRef.current.contains(event.target as Node)) setShowFilterModal(false);
      if (sortModalRef.current && !sortModalRef.current.contains(event.target as Node)) setShowSortModal(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFiltersCount = [
    filters.categoryId !== 'all',
    filters.brandId !== 'all',
    filters.warehouseId !== 'all',
    filters.isPublished !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Product Catalog</h1>
          <p className="text-muted text-sm mt-1">Manage your store inventory and product variations.</p>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 active:scale-95 group w-full lg:w-auto"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          Add New Product
        </button>
      </div>

      {/* Top Actions Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-surface p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <input
            type="text"
            placeholder="Search by title, ID, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-brand transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:flex-none">
              <button 
                onClick={() => setShowFilterModal(!showFilterModal)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-bold transition-all ${
                  showFilterModal || activeFiltersCount > 0 ? 'bg-brand/5 border-brand text-brand' : 'bg-background text-muted hover:text-primary'
                }`}
              >
                <Filter size={18} />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 bg-brand text-white text-[10px] rounded-full ml-1">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {showFilterModal && (
                <div ref={filterModalRef} className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] sm:w-[340px] bg-surface border border-border rounded-2xl shadow-2xl z-50 p-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-primary">Advanced Filters</h4>
                    <button onClick={() => setShowFilterModal(false)} className="text-muted hover:text-primary transition-colors">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block ml-1">Category</label>
                      <select 
                        value={filters.categoryId}
                        onChange={(e) => setFilters({...filters, categoryId: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-sm focus:outline-none focus:border-brand font-medium"
                      >
                        <option value="all">All Categories</option>
                        {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block ml-1">Brand</label>
                      <select 
                        value={filters.brandId}
                        onChange={(e) => setFilters({...filters, brandId: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-sm focus:outline-none focus:border-brand font-medium"
                      >
                        <option value="all">All Brands</option>
                        {brands?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block ml-1">Warehouse</label>
                      <select 
                        value={filters.warehouseId}
                        onChange={(e) => setFilters({...filters, warehouseId: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-sm focus:outline-none focus:border-brand font-medium"
                      >
                        <option value="all">All Warehouses</option>
                        {warehouses?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block ml-1">Publish Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setFilters({...filters, isPublished: filters.isPublished === 'true' ? 'all' : 'true'})}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                            filters.isPublished === 'true' ? 'bg-brand/10 border-brand text-brand' : 'border-border text-muted hover:border-gray-300'
                          }`}
                        >
                          Live Only
                        </button>
                        <button 
                          onClick={() => setFilters({...filters, isPublished: filters.isPublished === 'false' ? 'all' : 'false'})}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                            filters.isPublished === 'false' ? 'bg-brand/10 border-brand text-brand' : 'border-border text-muted hover:border-gray-300'
                          }`}
                        >
                          Not Published
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3 pt-6 border-t border-border">
                    <button 
                      onClick={() => {
                        setFilters({ ...filters, categoryId: 'all', brandId: 'all', warehouseId: 'all', isPublished: 'all' });
                        setShowFilterModal(false);
                      }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-border hover:bg-background transition-colors text-muted"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => setShowFilterModal(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-brand text-white hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20"
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
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-bold transition-all ${
                  showSortModal ? 'bg-brand/5 border-brand text-brand' : 'bg-background text-muted hover:text-primary'
                }`}
              >
                <ArrowUpDown size={18} />
                Sort
              </button>
              {showSortModal && (
                <div ref={sortModalRef} className="absolute top-full right-0 mt-3 w-48 bg-surface border border-border rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-wider border-b border-border mb-1">Sort Catalog By</div>
                  {[
                    { label: 'Newest First', value: 'newest' },
                    { label: 'Oldest First', value: 'oldest' },
                  ].map((option) => (
                    <button 
                      key={option.value} 
                      onClick={() => {
                        setFilters({ ...filters, sort: option.value });
                        setShowSortModal(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-background flex items-center justify-between ${
                        filters.sort === option.value ? 'text-brand' : 'text-primary'
                      }`}
                    >
                      {option.label}
                      {filters.sort === option.value && <Check size={16} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
        {/* Results Info */}
        <div className="px-6 py-4 border-b border-border bg-gray-50/30 flex items-center justify-between">
          <div className="text-xs text-muted font-bold uppercase tracking-wider">
            {totalResults} Products Total
          </div>
          <div className="flex gap-4">
             {filters.categoryId !== 'all' && (
               <span className="bg-brand/10 text-brand px-2 py-1 rounded text-[10px] font-bold border border-brand/20 flex items-center gap-1">
                 Category: {categories?.find((c: any) => c.id === filters.categoryId)?.name}
                 <button onClick={() => setFilters({...filters, categoryId: 'all'})}><X size={10} /></button>
               </span>
             )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#F2F9F4] border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Organization</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-12 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-red-500">
                    <AlertCircle className="mx-auto mb-2" size={32} />
                    <p className="font-bold">Failed to load products</p>
                    <button onClick={() => refetch()} className="text-xs underline mt-2">Retry</button>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p: any) => (
                  <ProductRow 
                    key={p.id} 
                    product={p} 
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggle={onToggle}
                    onQuickEdit={onQuickEdit}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center text-muted">
                        <Package size={32} />
                      </div>
                      <div className="max-w-xs mx-auto">
                        <h3 className="text-lg font-bold text-primary">No products found</h3>
                        <p className="text-sm text-muted mt-1">Try adjusting your search or filters to find what you're looking for.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setFilters({
                            isPublished: 'all',
                            isActive: 'all',
                            brandId: 'all',
                            categoryId: 'all',
                            warehouseId: 'all',
                            sort: 'newest'
                          });
                        }} 
                        className="bg-brand text-white px-6 py-2 rounded-xl font-bold text-sm"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          total={totalResults}
          limit={10}
        />
      )}
    </div>
  );
}
