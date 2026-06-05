'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  X, 
  Edit, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Image as ImageIcon,
  Upload,
  AlertCircle,
  Loader2,
  Check,
  Lock,
  Unlock,
  Package
} from 'lucide-react';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory,
  useEligibleParents,
  Category 
} from '@/lib/hooks/useCategories';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { z } from 'zod';
import Image from 'next/image';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  parentCategoryId: z
    .string()
    .regex(objectIdRegex, 'Invalid Parent Category ID')
    .or(z.literal(''))
    .optional()
    .nullable(),
});

export default function CategoriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Queries & Mutations
  const { data: categories, isLoading, isError, refetch } = useCategories(
    debouncedSearchQuery, 
    'all'
  );
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // Form State
  const [name, setName] = useState('');
  const [taxRate, setTaxRate] = useState<string>('0');
  const [slug, setSlug] = useState('');
  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [parentCategoryId, setParentCategoryId] = useState<string>('');
  const [parentSearch, setParentSearch] = useState('');
  const debouncedParentSearch = useDebounce(parentSearch, 300);
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [selectedParentName, setSelectedParentName] = useState('None (Root Category)');
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  // Fetch eligible parents specifically
  const { data: eligibleParents, isLoading: isLoadingParents } = useEligibleParents(
    debouncedParentSearch,
    editingCategory?._id,
    { enabled: debouncedParentSearch.length >= 2 }
  );

  // Derive parent categories for the dropdown - only from search results
  const parentCategoriesList = debouncedParentSearch.length >= 2 ? eligibleParents : [];

  const selectedParentCategory = parentCategoriesList?.find(c => (c._id || c.id) === parentCategoryId) || 
    (() => {
      const findCategory = (nodes: Category[], id: string): Category | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findCategory(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      return categories ? findCategory(categories, parentCategoryId) : null;
    })();

  const parentTaxText = selectedParentCategory?.effectiveTax 
    ? `${selectedParentCategory.effectiveTax.reduce((sum: number, t: any) => sum + t.slab, 0)}% (${selectedParentCategory.effectiveTax.map((t: any) => t.name).join(' + ')})`
    : 'Exempted (0%)';

  // Auto-generate slug from name
  useEffect(() => {
    if (isSlugLocked && !editingCategory) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
    }
  }, [name, isSlugLocked, editingCategory]);

  // Effect to auto-expand nodes when searching
  useEffect(() => {
    if (debouncedSearchQuery && categories) {
      const allIds = new Set<string>();
      const addIds = (nodes: Category[]) => {
        nodes.forEach(node => {
          if (node.children && node.children.length > 0) {
            allIds.add(node.id);
            addIds(node.children);
          }
        });
      };
      addIds(categories);
      setExpandedCategories(allIds);
    }
  }, [debouncedSearchQuery, categories]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setIsSlugLocked(true);
    setParentCategoryId(category.parentCategoryId || '');
    
    // Find parent name from current data
    if (category.parentCategoryId && categories) {
      const findCategory = (nodes: Category[], id: string): Category | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findCategory(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      const parent = findCategory(categories, category.parentCategoryId);
      setSelectedParentName(parent ? parent.name : 'None (Root Category)');
    } else {
      setSelectedParentName('None (Root Category)');
    }

    setImagePreview(category.imageUrl || null);
    setImageFile(null);
    setIconPreview(category.iconUrl || null);
    setIconFile(null);
    if (category.taxes && category.taxes.length > 0) {
      const totalSlab = category.taxes.reduce((sum, t) => sum + t.slab, 0);
      setTaxRate(totalSlab.toString());
    } else if (category.effectiveTax && category.effectiveTax.length > 0) {
      const totalSlab = category.effectiveTax.reduce((sum, t) => sum + t.slab, 0);
      setTaxRate(totalSlab.toString());
    } else {
      setTaxRate('0');
    }
    setFieldErrors({});
    setServerError(null);
    setShowAddModal(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setIsSlugLocked(true);
    setParentCategoryId('');
    setSelectedParentName('None (Root Category)');
    setParentSearch('');
    setTaxRate('0');
    setImageFile(null);
    setImagePreview(null);
    setFieldErrors({});
    setServerError(null);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    setDeleteError(null);
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      setDeleteError(null);
      try {
        await deleteCategory.mutateAsync(showDeleteConfirm);
        setShowDeleteConfirm(null);
      } catch (error: any) {
        setDeleteError(error.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    try {
      categorySchema.parse({ name, slug, parentCategoryId });
      setFieldErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFieldErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    if (parentCategoryId && parentCategoryId.trim() !== '') {
      formData.append('parentCategoryId', parentCategoryId);
      // Do not append taxes, it will inherit from parent
      // If editing, explicitly set to empty array to clear any existing overrides
      if (editingCategory) {
        formData.append('taxes', JSON.stringify([]));
      }
    } else {
      if (taxRate === '0') {
        formData.append('taxes', JSON.stringify([{ name: 'Exempted', slab: 0 }]));
      } else {
        formData.append('taxes', JSON.stringify([{ name: 'GST', slab: Number(taxRate) }]));
      }
    }

    if (imageFile) {
      formData.append('image', imageFile);
    } else if (!editingCategory) {
      setFieldErrors(prev => ({ ...prev, image: 'Category image is required' }));
      return;
    }

    if (iconFile) {
      formData.append('icon', iconFile);
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory._id, formData });
      } else {
        await createCategory.mutateAsync(formData);
      }
      setShowAddModal(false);
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Failed to save category');
    }
  };

  const isMutationLoading = createCategory.isPending || updateCategory.isPending;

  // Recursive Component for Category Row
  const CategoryRow = ({ 
    category, 
    depth = 0, 
    isLast = false, 
    parentLast = [] 
  }: { 
    category: Category; 
    depth?: number;
    isLast?: boolean;
    parentLast?: boolean[];
  }) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <>
        <tr className="hover:bg-[#F9FAFB] transition-colors group">
          <td className="px-6 py-4">
            <div className="flex items-center relative min-h-10">
              {/* Vertical lines for parent levels */}
              {parentLast.map((isParentLast, idx) => (
                <div 
                  key={idx}
                  className={`absolute top-0 bottom-0 w-px ${!isParentLast ? 'bg-border' : ''}`}
                  style={{ left: `${idx * 32 + 12}px` }}
                />
              ))}

              {/* Connector for current level */}
              {depth > 0 && (
                <>
                  <div 
                    className={`absolute top-0 w-px bg-border ${isLast ? 'h-1/2' : 'h-full'}`}
                    style={{ left: `${(depth - 1) * 32 + 12}px` }}
                  />
                  <div 
                    className="absolute top-1/2 h-px bg-border"
                    style={{ left: `${(depth - 1) * 32 + 12}px`, width: '20px' }}
                  />
                </>
              )}

              <div 
                className="flex items-center gap-3 relative" 
                style={{ paddingLeft: `${depth * 32}px` }}
              >
                <button 
                  onClick={() => hasChildren && toggleExpand(category.id)}
                  className={`z-10 w-6 h-6 rounded flex items-center justify-center transition-all ${
                    !hasChildren 
                      ? 'invisible' 
                      : isExpanded 
                        ? 'bg-brand text-white shadow-sm' 
                        : 'bg-white border border-border text-muted hover:border-brand hover:text-brand shadow-sm'
                  }`}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background border border-border overflow-hidden shrink-0 shadow-sm group-hover:border-brand/30 transition-colors">
                    {category.imageUrl ? (
                      <Image height={20} width={20} src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted/40">
                        <ImageIcon size={18} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-primary group-hover:text-brand transition-colors">{category.name}</div>
                    <div className="text-[10px] text-muted font-medium uppercase tracking-wider">{category.slug}</div>
                  </div>
                </div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              hasChildren ? 'bg-brand/10 text-brand-dark' : 'bg-gray-100 text-gray-500'
            }`}>
              {category.children?.length || 0} Sub-categories
            </div>
          </td>
          <td className="px-6 py-4">
             <div className="text-[10px] text-muted font-mono opacity-50 group-hover:opacity-100 transition-opacity">{category._id}</div>
          </td>
          <td className="px-6 py-4 text-right">
            <div className="flex items-center justify-end gap-2">
              <button 
                onClick={() => router.push(`/admin/products/list?categoryId=${category._id}`)}
                className="p-1.5 text-brand hover:bg-brand/5 rounded-lg transition-all flex items-center gap-1.5"
                title="View Products in this category"
              >
                <Package size={16} />
                <span className="text-[10px] font-bold uppercase hidden xl:inline">Products</span>
              </button>
              <button 
                onClick={() => handleEdit(category)}
                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                title="Edit"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => handleDelete(category._id)}
                className="p-1.5 text-[#FF6B6B] hover:bg-red-50 rounded-lg transition-all"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </td>
        </tr>
        {isExpanded && hasChildren && category.children!.map((child, index) => (
          <CategoryRow 
            key={child._id || child.id} 
            category={child} 
            depth={depth + 1} 
            isLast={index === category.children!.length - 1}
            parentLast={[...parentLast, isLast]}
          />
        ))}
      </>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Category Management</h1>
          <p className="text-muted text-sm mt-1">Organize your products into a hierarchical structure.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 active:scale-95 w-full lg:w-auto justify-center"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-border bg-surface flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <input
              type="text"
              placeholder="Search categories by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          </div>
          <div className="text-xs font-medium text-muted w-full lg:w-auto text-center lg:text-right">
            {categories?.length || 0} Root Categories
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#F2F9F4] border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Category Name</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Structure</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-red-500">
                      <AlertCircle size={24} />
                      <p className="font-bold">Failed to load categories</p>
                      <button onClick={() => refetch()} className="text-xs underline">Retry</button>
                    </div>
                  </td>
                </tr>
              ) : categories && categories.length > 0 ? (
                categories.map((category, index) => (
                  <CategoryRow 
                    key={category.id} 
                    category={category} 
                    isLast={index === categories.length - 1}
                    parentLast={[]}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted">
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center bg-[#F9FAFB] shrink-0">
              <h2 className="text-lg font-bold text-primary">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-background rounded-lg text-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                {serverError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} />
                    {serverError}
                  </div>
                )}

                {/* Image Upload Area */}
                <div className="flex gap-8">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Category Image</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="relative aspect-square w-full max-w-[160px] rounded-2xl border-2 border-dashed border-border hover:border-brand transition-all bg-background flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
                    >
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload className="text-white" size={24} />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-muted group-hover:text-brand transition-colors">
                          <Upload size={24} className="mb-2" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Upload</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden" 
                        accept="image/*" 
                      />
                    </div>
                    {fieldErrors.image && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{fieldErrors.image}</p>
                    )}
                    <p className="text-[10px] text-muted mt-2 italic">* Category Banner (512x512px)</p>
                  </div>

                  <div className="flex-1">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Category Icon (Header)</label>
                    <div 
                      onClick={() => iconInputRef.current?.click()}
                      className="relative aspect-square w-full max-w-[160px] rounded-2xl border-2 border-dashed border-border hover:border-brand transition-all bg-background flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
                    >
                      {iconPreview ? (
                        <>
                          <img src={iconPreview} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload className="text-white" size={24} />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-muted group-hover:text-brand transition-colors">
                          <Upload size={24} className="mb-2" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Upload Icon</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={iconInputRef}
                        onChange={handleIconChange}
                        className="hidden" 
                        accept="image/*" 
                      />
                    </div>
                    {fieldErrors.icon && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{fieldErrors.icon}</p>
                    )}
                    <p className="text-[10px] text-muted mt-2 italic">* Small icon for header menu</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block">Category Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Traditional Jewellery"
                      className={`w-full bg-background border rounded-xl py-2.5 px-4 text-sm focus:outline-none transition-all ${
                        fieldErrors.name ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'
                      }`}
                    />
                    {fieldErrors.name && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block">Slug</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        readOnly={isSlugLocked}
                        placeholder="category-slug"
                        className={`w-full bg-background border rounded-xl py-2.5 px-4 text-sm focus:outline-none transition-all pr-12 ${
                          isSlugLocked ? 'text-muted cursor-not-allowed bg-muted/5' : 'text-primary'
                        } ${
                          fieldErrors.slug ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setIsSlugLocked(!isSlugLocked)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-background rounded-lg text-muted transition-colors"
                      >
                        {isSlugLocked ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                    </div>
                    {fieldErrors.slug && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{fieldErrors.slug}</p>
                    )}
                  </div>

                  {/* Parent Category Search Selector */}
                  {/*<div className="relative">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block">Parent Category (Optional)</label>
                    <div 
                      onClick={() => setShowParentDropdown(!showParentDropdown)}
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm flex justify-between items-center cursor-pointer hover:border-brand transition-all"
                    >
                      <span className={parentCategoryId ? 'text-primary' : 'text-muted'}>{selectedParentName}</span>
                      <ChevronDown size={16} className={`text-muted transition-transform ${showParentDropdown ? 'rotate-180' : ''}`} />
                    </div>

                    {showParentDropdown && (
                      <div className="absolute z-60 mt-2 w-full bg-surface border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                        <div className="p-2 border-b border-border bg-[#F9FAFB] flex-shrink-0">
                          <div className="relative">
                            <input
                              type="text"
                              autoFocus
                              placeholder="Type at least 2 chars to search..."
                              value={parentSearch}
                              onChange={(e) => setParentSearch(e.target.value)}
                              className="w-full bg-background border border-border rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-brand"
                            />
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" size={14} />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar bg-surface">
                          <button
                            type="button"
                            onClick={() => {
                              setParentCategoryId('');
                              setSelectedParentName('None (Root Category)');
                              setShowParentDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs hover:bg-background transition-colors flex items-center justify-between border-b border-border/50"
                          >
                            <span className="font-medium">None (Root Category)</span>
                            {parentCategoryId === '' && <Check size={14} className="text-brand" />}
                          </button>
                          
                          {isLoadingParents ? (
                            <div className="px-4 py-4 flex justify-center"><Loader2 size={16} className="animate-spin text-brand" /></div>
                          ) : (
                            parentCategoriesList && parentCategoriesList.length > 0 ? (
                              parentCategoriesList.map((cat: any) => (
                                <button
                                  key={cat._id || cat.id}
                                  type="button"
                                  onClick={() => {
                                    setParentCategoryId(cat._id || cat.id);
                                    setSelectedParentName(cat.name);
                                    setShowParentDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-background transition-colors flex items-center justify-between"
                                >
                                  <span>{cat.name}</span>
                                  {parentCategoryId === (cat._id || cat.id) && <Check size={14} className="text-brand" />}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-4 text-xs text-muted text-center italic">
                                {debouncedParentSearch.length >= 2 ? 'No eligible categories found' : 'Type at least 2 chars to search...'}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {fieldErrors.parentCategoryId && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{fieldErrors.parentCategoryId}</p>
                    )}
                  </div>*/}

                  {/* TAX SETTINGS */}
                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block">Tax Rate</label>
                    {parentCategoryId ? (
                      <div className="w-full bg-muted/5 border border-border rounded-xl py-2.5 px-4 text-sm text-muted cursor-not-allowed">
                        {parentTaxText} - Inherited from Parent
                      </div>
                    ) : (
                      <select 
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all"
                      >
                        <option value="0">Exempted (0%)</option>
                        <option value="5">GST 5%</option>
                        <option value="12">GST 12%</option>
                        <option value="18">GST 18%</option>
                        <option value="28">GST 28%</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border bg-[#F9FAFB] flex gap-3 flex-shrink-0">
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
                  {isMutationLoading ? <Loader2 size={18} className="animate-spin" /> : (editingCategory ? 'Save Changes' : 'Create Category')}
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
        title="Delete Category?"
        message="Are you sure you want to delete this category? This action will also affect all its sub-categories and cannot be undone."
        isLoading={deleteCategory.isPending}
        error={deleteError}
      />
    </div>
  );
}
