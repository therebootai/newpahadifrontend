'use client';

import { useState, useRef } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  Edit, 
  Trash2, 
  Upload,
  ShoppingCart,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useDebounce } from 'use-debounce';
import Pagination from '@/components/admin/Pagination';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { 
  useBrands, 
  useCreateBrand, 
  useUpdateBrand, 
  useDeleteBrand,
  Brand 
} from '@/lib/hooks/useBrands';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BrandsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Queries & Mutations
  const { data: brands, isLoading, isError, refetch, isFetching } = useBrands(debouncedSearch);
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  // Form State
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setLogoPreview(brand.logo || null);
    setLogoFile(null);
    setFieldErrors({});
    setServerError(null);
    setShowAddModal(true);
  };

  const handleAdd = () => {
    setEditingBrand(null);
    setName('');
    setLogoFile(null);
    setLogoPreview(null);
    setFieldErrors({});
    setServerError(null);
    setShowAddModal(true);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = 'Brand name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Brand name must be at least 2 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDelete = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      await deleteBrand.mutateAsync(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      if (fieldErrors.logo) setFieldErrors(prev => ({ ...prev, logo: '' }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    const formData = new FormData();
    formData.append('name', name);
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      if (editingBrand) {
        await updateBrand.mutateAsync({ id: editingBrand.id, formData });
      } else {
        await createBrand.mutateAsync(formData);
      }
      setShowAddModal(false);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Something went wrong. Please try again.';
      setServerError(message);
    }
  };

  const BRANDS_PER_PAGE = 8;
  const filteredBrands: Brand[] = brands || [];
  const totalPages = Math.ceil(filteredBrands.length / BRANDS_PER_PAGE);
  const currentBrands = filteredBrands.slice((currentPage - 1) * BRANDS_PER_PAGE, currentPage * BRANDS_PER_PAGE);

  const isMutationLoading = createBrand.isPending || updateBrand.isPending;

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Brand Management</h1>
          <p className="text-muted text-sm mt-1">Manage your partner brands and their identity.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 active:scale-95 w-full lg:w-auto justify-center"
        >
          <Plus size={18} />
          Add Brand
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand transition-all"
          />
          {isFetching && !isLoading ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-brand animate-spin" size={18} />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          )}
        </div>
        <div className="text-xs font-medium text-muted w-full lg:w-auto text-center lg:text-right">
          Showing {filteredBrands.length} brands
        </div>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start relative min-h-[400px]">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-border p-5 space-y-4 shadow-sm">
              <div className="flex justify-center">
                <Skeleton className="w-24 h-24 rounded-2xl" />
              </div>
              <div className="space-y-2 flex flex-col items-center">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))
        ) : isError ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-red-50 border border-red-100 rounded-2xl text-red-600">
            <AlertCircle size={40} className="mb-4" />
            <p className="font-bold">Error loading brands</p>
            <p className="text-sm">Please check your connection and try again.</p>
            <button 
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all"
            >
              Retry
            </button>
          </div>
        ) : currentBrands.length > 0 ? (
          currentBrands.map((brand) => (
            <div key={brand.id} className="group bg-surface rounded-2xl border border-border p-5 shadow-sm hover:border-brand hover:shadow-md transition-all relative overflow-hidden h-fit">
              {/* Corner Action Buttons */}
              <div className="absolute top-3 right-3 flex gap-1.5">
                <button 
                  onClick={() => handleEdit(brand)}
                  className="p-1.5 bg-background border border-border rounded-lg text-muted hover:text-brand-dark hover:border-brand transition-all"
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(brand.id)}
                  className="p-1.5 bg-background border border-border rounded-lg text-muted hover:text-[#FF6B6B] hover:border-[#FF6B6B] transition-all"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-3">
                {/* Brand Identity (Logo or Name) */}
                <div className="w-24 h-24 rounded-2xl bg-background border border-border flex items-center justify-center overflow-hidden">
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <span className="text-2xl font-bold text-brand-dark">{brand.name.charAt(0)}</span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-primary group-hover:text-brand-dark transition-colors truncate max-w-full px-2">{brand.name}</h3>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-xl border border-border w-full justify-center group-hover:border-brand/30 transition-colors">
                  <ShoppingCart size={14} className="text-brand-dark" />
                  <span className="text-sm font-bold text-primary">{brand.productCount || 0}</span>
                  <span className="text-xs text-muted font-medium">Products</span>
                </div>
              </div>
            </div>
          ))
        ) : (

          <div className="col-span-full py-20 text-center bg-surface rounded-2xl border border-border w-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-muted">
                <Search size={24} />
              </div>
              <div>
                <p className="text-primary font-bold">No brands found</p>
                <p className="text-muted text-sm">Try adjusting your search query</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={(page) => setCurrentPage(page)} 
        />
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-border flex justify-between items-center bg-[#F9FAFB]">
              <h2 className="text-lg font-bold text-primary">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-background rounded-lg text-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                {serverError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} />
                    {serverError}
                  </div>
                )}

                {/* Image Upload Area */}
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Brand Logo</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`group relative w-32 h-32 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center bg-background cursor-pointer overflow-hidden ${
                      fieldErrors.logo ? 'border-red-500 bg-red-50/30' : 'border-border hover:border-brand'
                    }`}
                  >
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-3" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="text-white" size={24} />
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className={`transition-colors mb-2 ${fieldErrors.logo ? 'text-red-400' : 'text-muted group-hover:text-brand'}`} size={24} />
                        <span className={`text-[10px] font-bold transition-colors ${fieldErrors.logo ? 'text-red-400' : 'text-muted group-hover:text-brand'}`}>Upload Logo</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden" 
                      accept="image/*" 
                    />
                  </div>
                  {fieldErrors.logo && (
                    <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{fieldErrors.logo}</p>
                  )}
                  <p className="text-[10px] text-muted mt-2 italic">* Recommended size: 256x256px (PNG with transparency preferred)</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block">Brand Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                      }}
                      placeholder="e.g. Nike, Apple, Sony"
                      className={`w-full bg-background border rounded-xl py-2.5 px-4 text-sm focus:outline-none transition-all ${
                        fieldErrors.name ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'
                      }`}
                    />
                    {fieldErrors.name && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{fieldErrors.name}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border bg-[#F9FAFB] flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-border rounded-xl text-sm font-bold text-primary hover:bg-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isMutationLoading}
                  className="flex-1 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isMutationLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    editingBrand ? 'Save Changes' : 'Create Brand'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Brand?"
        message="Are you sure you want to delete this brand? This action will remove the brand association from all its products."
        isLoading={deleteBrand.isPending}
      />
    </div>
  );
}
