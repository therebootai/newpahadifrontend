'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  ToggleRight, 
  ToggleLeft,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  ImagePlus
} from 'lucide-react';
import { useCategories, Category } from '@/lib/hooks/useCategories';
import { useBrands, Brand } from '@/lib/hooks/useBrands';
import { useWarehouses, Warehouse } from '@/lib/hooks/useWarehouses';
import { useCreateProduct, useUpdateProduct, usePublishProduct, Product } from '@/lib/hooks/useProducts';
import { useCreateVariant, useUpdateVariant, useDeleteVariant, useToggleVariantStatus, useVariants, Variant } from '@/lib/hooks/useVariants';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { toast } from 'sonner';
import { productBasicSchema, variantSchema } from '@/lib/validations/product';
import { z } from 'zod';
import RichTextEditor from '@/components/admin/RichTextEditor';

interface ProductFormProps {
  product?: Product | null;
  onBack: () => void;
}

interface Spec {
  key: string;
  value: string;
}

interface TaxEntry {
  name: string;
  slab: string;
}

interface Attribute {
  name: string;
  value: string;
}

interface FormVariant {
  id?: string;
  title: string;
  sku: string;
  stocks: string;
  stockStatus?: string;
  price: string;
  mrp: string;
  discount: string;
  discountType?: string;
  taxSlab?: string;
  taxIncluded?: string;
  taxRate?: string;
  attributes: Attribute[];
  image: File | null;
  imagePreview: string | null;
  additionalImages?: File[];
  additionalPreviews?: string[];
  isDefault?: boolean;
}

const PREDEFINED_ATTRIBUTES = [
  { group: 'Common', keys: ['Color', 'Size', 'Length', 'Material', 'Weight', 'Gender'] },
  { group: 'Jewellery Details', keys: ['Metal Type', 'Metal Purity', 'Metal Color', 'Stone Type', 'Stone Color', 'Certification', 'Occasion'] },
];

export default function ProductForm({ product, onBack }: ProductFormProps) {
  const [mode, setMode] = useState<'single' | 'variable'>(product ? 'variable' : 'single');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBasicDetailsOpen, setIsBasicDetailsOpen] = useState(true);
  
  const [currentProductId, setCurrentProductId] = useState<string | null>(product?.id || null);
  const [hasInitializedMode, setHasInitializedMode] = useState(false);
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [variantErrors, setVariantErrors] = useState<Record<string, string>>({});
  const [removedImagesPublicIds, setRemovedImagesPublicIds] = useState<string[]>([]);
  
  

  const getSelectedCategory = (id: string, tree: Category[] | undefined): Category | null => {
    if (!tree || !id) return null;
    for (const n of tree) {
      if (n.id === id || (n as any)._id === id) return n;
      if (n.children) {
        const found = getSelectedCategory(id, n.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Brand Search State
  const [brandSearch, setBrandSearch] = useState('');
  const [showBrandResults, setShowBrandResults] = useState(false);
  const brandRef = useRef<HTMLDivElement>(null);
  const debouncedBrandSearch = useDebounce(brandSearch, 500);

  // Categories Selection State
  const [categoryPath, setCategoryPath] = useState<string[]>([]);

  const { data: categoryTree } = useCategories('', 'all');
  const { data: brands, isLoading: isBrandsLoading } = useBrands(debouncedBrandSearch, { enabled: debouncedBrandSearch.length > 0 });
  const { data: warehouses } = useWarehouses(true);
  const { data: variantsData } = useVariants(product?.id || '');

  // Helper to find path to a category ID in the tree
  const findPathToCategory = (tree: Category[], targetId: string, currentPath: string[] = []): string[] | null => {
    for (const node of tree) {
      if (node.id === targetId) return [...currentPath, node.id];
      if (node.children && node.children.length > 0) {
        const path = findPathToCategory(node.children, targetId, [...currentPath, node.id]);
        if (path) return path;
      }
    }
    return null;
  };

  // Effect to handle initial category and brand for editing
  useEffect(() => {
    if (product) {
      if (product.brandId) {
        if (typeof product.brandId === 'object' && (product.brandId as any).name) {
          setBrandSearch((product.brandId as any).name);
        } else if (brands) {
          const bId = product.brandId;
          const brand = brands.find((b: any) => b.id === bId || b._id === bId);
          if (brand) setBrandSearch(brand.name);
        }
      }
      
      if (product.categoryId && categoryTree && categoryPath.length === 0) {
        const cId = typeof product.categoryId === 'object' ? product.categoryId._id : product.categoryId;
        const path = findPathToCategory(categoryTree, cId);
        if (path) setCategoryPath(path);
      }
    }
  }, [product, brands, categoryTree]);

  // Handle click outside brand results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (brandRef.current && !brandRef.current.contains(event.target as Node)) {
        setShowBrandResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Basic Product State
  const [basicData, setBasicData] = useState({
    title: product?.title || '',
    desc: product?.desc || '',
    brandId: typeof product?.brandId === 'object' ? (product.brandId as any)?._id : (product?.brandId || ''),
    categoryId: typeof product?.categoryId === 'object' ? (product.categoryId as any)?._id : (product?.categoryId || ''),
    pickupWareHouseId: typeof product?.pickupWareHouseId === 'object' ? (product.pickupWareHouseId as any)?._id : (product?.pickupWareHouseId || ''),
    returnPolicyType: product?.returnPolicyType || 'REPLACE',
    returnWindowDays: product?.returnWindowDays || 7,
    isActive: product?.isActive ?? true,
  });
  const [specs, setSpecs] = useState<Spec[]>(product?.specs || [{ key: '', value: '' }]);

  // Single Product Fields
  const [singleVariant, setSingleVariant] = useState({
    id: '',
    sku: '',
    stocks: '0',
    stockStatus: 'In Stock',
    price: '',
    mrp: '',
    discount: '',
    discountType: 'percentage' as 'percentage' | 'flat',
    taxSlab: '',
    taxIncluded: 'yes',
    taxRate: '0',
    attributes: [{ name: '', value: '' }] as Attribute[],
    image: null as File | null,
    imagePreview: null as string | null,
    additionalImages: [] as File[],
    additionalPreviews: [] as string[]
  });

  
  const addSingleAttribute = () => setSingleVariant(prev => ({ ...prev, attributes: [...prev.attributes, { name: '', value: '' }] }));
  const removeSingleAttribute = (index: number) => setSingleVariant(prev => ({ ...prev, attributes: prev.attributes.filter((_, i) => i !== index) }));
  const updateSingleAttribute = (index: number, field: keyof Attribute, value: string) => {
    setSingleVariant(prev => {
      const newAttrs = [...prev.attributes];
      newAttrs[index][field] = value;
      return { ...prev, attributes: newAttrs };
    });
  };

  // Pricing Calculation Logic for Single Product
  const handleSinglePricingChange = (type: 'mrp' | 'price' | 'discount' | 'discountType', value: string) => {
    setSingleVariant(prev => {
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

  // Variable Product Fields
  const [currentVariant, setCurrentVariant] = useState({
    title: '',
    sku: '',
    stocks: '0',
    stockStatus: 'In Stock',
    price: '',
    mrp: '',
    discount: '',
    discountType: 'percentage' as 'percentage' | 'flat',
    attributes: [{ name: '', value: '' }] as Attribute[],
    image: null as File | null,
    imagePreview: null as string | null,
    additionalImages: [] as File[],
    additionalPreviews: [] as string[]
  });

  const addVariantAttribute = () => setCurrentVariant(prev => ({ ...prev, attributes: [...prev.attributes, { name: '', value: '' }] }));
  const removeVariantAttribute = (index: number) => setCurrentVariant(prev => ({ ...prev, attributes: prev.attributes.filter((_, i) => i !== index) }));
  const updateVariantAttribute = (index: number, field: keyof Attribute, value: string) => {
    setCurrentVariant(prev => {
      const newAttrs = [...prev.attributes];
      newAttrs[index][field] = value;
      return { ...prev, attributes: newAttrs };
    });
  };

  const [variantsList, setVariantsList] = useState<FormVariant[]>([]);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [isSkuLocked, setIsSkuLocked] = useState(true);
  const [isVariantSkuLocked, setIsVariantSkuLocked] = useState(true);

  // Global Tax State for Variable Products
  const [globalTaxData, setGlobalTaxData] = useState({
    taxIncluded: 'yes',
    taxRate: '0'
  });

  const selectedCategoryObj = getSelectedCategory(basicData.categoryId, categoryTree);
  const categoryTax = (selectedCategoryObj as any)?.effectiveTax || [];
  const categoryTaxRateVal = categoryTax.reduce((sum: number, t: any) => sum + t.slab, 0);
  const categoryTaxName = categoryTax.map((t: any) => t.name).join(' + ') || 'Exempted';
  const categoryTaxDisplay = `${categoryTaxName} - ${categoryTaxRateVal}%`;
  
  const currentTaxIncluded = mode === 'single' ? singleVariant.taxIncluded : globalTaxData.taxIncluded;
  const currentTaxRate = mode === 'single' ? singleVariant.taxRate : globalTaxData.taxRate;
  
  const handleTaxIncludedChange = (val: 'yes' | 'no') => {
    if (mode === 'single') setSingleVariant({...singleVariant, taxIncluded: val});
    else setGlobalTaxData({...globalTaxData, taxIncluded: val});
  };
  
  const handleTaxRateChange = (val: string) => {
    if (mode === 'single') setSingleVariant({...singleVariant, taxRate: val});
    else setGlobalTaxData({...globalTaxData, taxRate: val});
  };

  const [isDirty, setIsDirty] = useState(false);
  const [canTrackChanges, setCanTrackChanges] = useState(false);

  useEffect(() => {
    if (hasInitializedMode) {
      const timer = setTimeout(() => setCanTrackChanges(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasInitializedMode]);

  useEffect(() => {
    if (canTrackChanges && product) {
      setIsDirty(true);
    }
  }, [basicData, specs, singleVariant, variantsList, globalTaxData, mode]);

  
  // Pricing Calculation Logic for Variable Product
  const handleVariantPricingChange = (type: 'mrp' | 'price' | 'discount' | 'discountType', value: string) => {
    setCurrentVariant(prev => {
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

  // Helper to find category name from path
  const getCategoryName = (path: string[], tree: Category[] | undefined): string => {
    if (!path.length || !tree) return '';
    const lastId = path[path.length - 1];
    const findInTree = (nodes: Category[], id: string): string => {
      for (const n of nodes) {
        if (n.id === id) return n.name;
        if (n.children) {
          const found = findInTree(n.children, id);
          if (found) return found;
        }
      }
      return '';
    };
    return findInTree(tree, lastId);
  };

  const generatePatternSku = (brand: string, category: string, attrs: Attribute[]) => {
    const attrValues = attrs.map(a => a.value).filter(Boolean);
    return [brand, category, ...attrValues]
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .toUpperCase();
  };

  // Consolidated SKU Auto-generation
  useEffect(() => {
    const isLocked = mode === 'variable' ? isVariantSkuLocked : isSkuLocked;
    if (isLocked && (brandSearch || categoryPath.length)) {
      const catName = getCategoryName(categoryPath, categoryTree);
      const attrs = mode === 'variable' ? currentVariant.attributes : singleVariant.attributes;
      const generatedSku = generatePatternSku(brandSearch, catName, attrs);
      
      if (generatedSku) {
        if (mode === 'variable') {
          if (currentVariant.sku !== generatedSku) {
            setCurrentVariant(prev => ({ ...prev, sku: generatedSku }));
          }
        } else {
          if (singleVariant.sku !== generatedSku) {
            setSingleVariant(prev => ({ ...prev, sku: generatedSku }));
          }
        }
      }
    }
  }, [
    brandSearch, 
    categoryPath, 
    mode, 
    isVariantSkuLocked, 
    isSkuLocked, 
    categoryTree, 
    JSON.stringify(currentVariant.attributes), 
    JSON.stringify(singleVariant.attributes)
  ]);

  // Centralized Initialization from Product Prop
  useEffect(() => {
    if (product) {
      setBasicData({
        title: product.title || '',
        desc: product.desc || '',
        brandId: typeof product.brandId === 'object' ? (product.brandId as any)?._id : (product.brandId || ''),
        categoryId: typeof product.categoryId === 'object' ? (product.categoryId as any)?._id : (product.categoryId || ''),
        pickupWareHouseId: typeof product.pickupWareHouseId === 'object' ? (product.pickupWareHouseId as any)?._id : (product.pickupWareHouseId || ''),
        returnPolicyType: product.returnPolicyType || 'REPLACE',
        returnWindowDays: product.returnWindowDays || 7,
        isActive: product.isActive ?? true,
      });

      setSpecs(product.specs || [{ key: '', value: '' }]);
      setCurrentProductId(product.id);

      // Set global tax data from product
      setGlobalTaxData({
        taxIncluded: product.isTaxInclude ? 'yes' : 'no',
        taxRate: product.taxes && product.taxes.length > 0 ? String(product.taxes.reduce((sum, t) => sum + t.slab, 0)) : '0'
      });
    }
  }, [product]);

  useEffect(() => {
    if (variantsData && variantsData.length > 0 && !hasInitializedMode) {
      // Determine mode based on variants
      const firstV = variantsData[0];
      const isSingle = variantsData.length === 1 && (
        firstV.attributes?.type === 'single' || 
        firstV.title === 'Default' || 
        firstV.title === product?.title
      );
      
      setMode(isSingle ? 'single' : 'variable');
      setHasInitializedMode(true);

      if (isSingle) {
        const v = variantsData[0];
        setSingleVariant({
          id: v.id,
          sku: v.sku,
          stocks: String(v.stocks),
          stockStatus: v.stocks > 0 ? 'In Stock' : 'Out of Stock',
          price: String(v.price),
          mrp: String(v.mrp),
          discount: String(v.discount?.value ?? '0'),
          discountType: (v.discount?.type ?? 'percentage') as 'percentage' | 'flat',
          taxSlab: String(v.attributes?.taxSlab || ''),
          taxIncluded: product?.isTaxInclude ? 'yes' : 'no',
          taxRate: product?.taxes && product.taxes.length > 0 ? String(product.taxes.reduce((sum, t) => sum + t.slab, 0)) : '0',
          attributes: Object.entries(v.attributes || {}).filter(([k]) => !['taxSlab', 'taxIncluded', 'taxRate', 'taxes', 'discount', 'discountType', 'type'].includes(k)).map(([name, value]) => ({ name, value: String(value) })),
          imagePreview: v.coverImage?.url || null,
          image: null,
          additionalPreviews: v.imagesArray?.map((img: any) => img.url) || [],
          additionalImages: []
        });
      } else {
        const mappedVariants = variantsData.map((v: Variant) => ({
          id: v.id,
          title: v.title,
          sku: v.sku,
          stocks: String(v.stocks),
          stockStatus: v.stocks > 0 ? 'In Stock' : 'Out of Stock',
          price: String(v.price),
          mrp: String(v.mrp),
          discount: String(v.discount?.value ?? '0'),
          discountType: String(v.discount?.type ?? 'percentage'),
          taxSlab: String(v.attributes?.taxSlab || ''),
          taxIncluded: product?.isTaxInclude ? 'yes' : 'no',
          taxRate: product?.taxes && product.taxes.length > 0 ? String(product.taxes.reduce((sum, t) => sum + t.slab, 0)) : '0',
          attributes: Object.entries(v.attributes || {}).filter(([k]) => !['taxSlab', 'taxIncluded', 'taxRate', 'taxes', 'discount', 'discountType'].includes(k)).map(([name, value]) => ({ name, value: String(value) })),
          imagePreview: v.coverImage?.url || null,
          image: null,
          additionalPreviews: v.imagesArray?.map((img: any) => img.url) || [],
          additionalImages: [],
          isDefault: v.isDefault
        }));

        setVariantsList(mappedVariants);
      }
    }
  }, [variantsData, product, hasInitializedMode]);
  
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const publishProductMutation = usePublishProduct();
  const createVariantMutation = useCreateVariant();
  const updateVariantMutation = useUpdateVariant();
  const deleteVariantMutation = useDeleteVariant();
  const toggleVariantStatusMutation = useToggleVariantStatus();

  const addSpec = () => setSpecs([...specs, { key: '', value: '' }]);
  const removeSpec = (index: number) => setSpecs(specs.filter((_, i) => i !== index));

  const handleAddVariant = async () => {
    // 1. Validate Variant Data
    const vResult = variantSchema.safeParse({
      ...currentVariant,
      stocks: currentVariant.stockStatus === 'Out of Stock' ? '0' : currentVariant.stocks
    });

    // 2. Validate Basic Data (Only required if we haven't created the product yet)
    let bResult: any = null;
    if (!currentProductId) {
      bResult = productBasicSchema.safeParse(basicData);
    }

    // 3. Handle Validation Failures
    const isImageMissing = !currentVariant.image && !currentVariant.imagePreview;

    if (!vResult.success || (bResult && !bResult.success) || isImageMissing) {
      if (!vResult.success || isImageMissing) {
        const vErrors: Record<string, string> = {};
        if (!vResult.success) {
          vResult.error.issues?.forEach((err: any) => {
            if (err.path[0]) vErrors[err.path[0] as string] = err.message;
          });
        }
        if (isImageMissing) {
          vErrors.image = 'Variant cover image is required.';
        }
        setVariantErrors(vErrors);
      } else {
        setVariantErrors({});
      }

      if (bResult && !bResult.success) {
        const bErrors: Record<string, string> = {};
        bResult.error.issues?.forEach((err: any) => {
          if (err.path[0]) bErrors[err.path[0] as string] = err.message;
        });
        setErrors(bErrors);
        setIsBasicDetailsOpen(true);
      } else {
        setErrors({});
      }

      toast.error('Please fix the errors before adding a variant.');
      return;
    }

    // Custom tax validation as it's a dropdown now

    // 3.2 Duplicate Attribute Check
    const attrKeys = currentVariant.attributes.map(a => a.name.trim()).filter(Boolean);
    if (new Set(attrKeys).size !== attrKeys.length) {
      toast.error('Duplicate attribute names are not allowed.');
      return;
    }

    // Clear errors if everything passed
    setVariantErrors({});
    setErrors({});

    setIsAddingVariant(true);
    const loadingId = toast.loading(editingVariantIndex !== null ? 'Updating variant...' : 'Adding variant...');
    
    try {
      let productId = currentProductId;

      // 4. Create Base Product if it doesn't exist
      if (!productId) {
        const productFormData = new FormData();
        Object.entries(basicData).forEach(([key, value]) => {
          if (key !== 'isActive') {
            productFormData.append(key, String(value));
          }
        });
        productFormData.append('specs', JSON.stringify(specs.filter(s => s.key.trim() && s.value.trim())));
        productFormData.append('isPublished', 'false');
        
        // Add Global Tax Settings for Product Creation
        productFormData.append('isTaxInclude', globalTaxData.taxIncluded === 'yes' ? 'true' : 'false');
        productFormData.append('taxes', JSON.stringify(
          globalTaxData.taxIncluded === 'no' 
            ? [{ name: globalTaxData.taxRate === '0' ? 'Exempted' : 'GST', slab: Number(globalTaxData.taxRate) }] 
            : []
        ));

        const productResult = await createProductMutation.mutateAsync(productFormData);
        productId = productResult._id || productResult.id;
        setCurrentProductId(productId);
      }

      // 2. Prepare Variant Data
      const variantFormData = new FormData();
      variantFormData.append('productId', productId!);
      variantFormData.append('title', currentVariant.title || `${basicData.title} - Variant`);
      variantFormData.append('sku', currentVariant.sku);
      variantFormData.append('price', currentVariant.price);
      variantFormData.append('mrp', currentVariant.mrp);
      
      const finalStocks = currentVariant.stockStatus === 'Out of Stock' ? '0' : currentVariant.stocks;
      variantFormData.append('stocks', finalStocks);

      // Convert Attribute[] to Record<string, string>
      const attributesRecord: Record<string, string> = {};
      currentVariant.attributes.forEach(attr => {
        if (attr.name.trim() && attr.value.trim()) {
          attributesRecord[attr.name.trim()] = attr.value.trim();
        }
      });

      variantFormData.append('attributes', JSON.stringify(attributesRecord));
      variantFormData.append('discount', JSON.stringify({
        type: currentVariant.discountType,
        value: Number(currentVariant.discount) || 0
      }));

      const isFirst = variantsList.length === 0;
      variantFormData.append('isDefault', String(editingVariantIndex !== null ? variantsList[editingVariantIndex].isDefault : isFirst));
      
      if (currentVariant.image) variantFormData.append('coverImage', currentVariant.image);
      if (currentVariant.additionalImages) {
        currentVariant.additionalImages.forEach(img => variantFormData.append('imagesArray', img));
      }
      removedImagesPublicIds.forEach(id => variantFormData.append('removedImagesPublicIds', id));

      let savedVariant: any;
      if (editingVariantIndex !== null && variantsList[editingVariantIndex].id) {
        // Update existing variant on backend
        savedVariant = await updateVariantMutation.mutateAsync({ 
          id: variantsList[editingVariantIndex].id!, 
          formData: variantFormData 
        });
        
        const newList = [...variantsList];
        newList[editingVariantIndex] = {
          ...currentVariant,
          id: savedVariant._id || savedVariant.id,
          stocks: finalStocks,
          isDefault: variantsList[editingVariantIndex].isDefault
        };
        setVariantsList(newList);
        setEditingVariantIndex(null);
        toast.success('Variant updated successfully.', { id: loadingId });
      } else {
        // Create new variant on backend
        savedVariant = await createVariantMutation.mutateAsync(variantFormData);
        
        const newFormVariant: FormVariant = { 
          ...currentVariant, 
          id: savedVariant._id || savedVariant.id,
          stocks: finalStocks,
          isDefault: isFirst
        };
        setVariantsList([...variantsList, newFormVariant]);
        toast.success('Variant added successfully.', { id: loadingId });
      }

      // Reset form
      setCurrentVariant({
        title: '', sku: '', stocks: '0', stockStatus: 'In Stock', price: '', mrp: '', discount: '', discountType: 'percentage', attributes: [{ name: '', value: '' }], image: null, imagePreview: null, additionalImages: [], additionalPreviews: []
      });
      setIsVariantSkuLocked(true);
      setRemovedImagesPublicIds([]);

    } catch (error) {
      console.error('Variant operation failed:', error);
      toast.error('Failed to save variant.', { id: loadingId });
    } finally {
      setIsAddingVariant(false);
    }
  };

  const removeVariant = async (index: number) => {
    const variantToDelete = variantsList[index];
    if (variantToDelete.id && currentProductId) {
      if (variantToDelete.isDefault) {
        toast.error('Cannot delete the default variant.');
        return;
      }
      
      const confirmDelete = window.confirm('Are you sure you want to delete this variant from the database?');
      if (!confirmDelete) return;

      const loadingId = toast.loading('Deleting variant...');
      try {
        await deleteVariantMutation.mutateAsync({ id: variantToDelete.id, productId: currentProductId });
        setVariantsList(variantsList.filter((_, i) => i !== index));
        toast.success('Variant deleted.', { id: loadingId });
      } catch (error) {
        toast.error('Failed to delete variant.', { id: loadingId });
      }
    } else {
      setVariantsList(variantsList.filter((_, i) => i !== index));
    }
  };

  const toggleDefaultVariant = async (index: number) => {
    const variant = variantsList[index];
    if (variant.id && currentProductId) {
      const loadingId = toast.loading('Setting as default...');
      try {
        const formData = new FormData();
        formData.append('isDefault', 'true');
        await updateVariantMutation.mutateAsync({ id: variant.id, formData });
        setVariantsList(variantsList.map((v, i) => ({ ...v, isDefault: i === index })));
        toast.success('Default variant updated.', { id: loadingId });
      } catch (error) {
        toast.error('Failed to update default variant.', { id: loadingId });
      }
    } else {
      setVariantsList(variantsList.map((v, i) => ({ ...v, isDefault: i === index })));
    }
  };

  const handlePublish = async () => {
    // 1. Validate Basic Data
    const bResult = productBasicSchema.safeParse(basicData);
    if (!bResult.success) {
      const fieldErrors: Record<string, string> = {};
      bResult.error.issues?.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      toast.error('Please fix product errors.');
      setIsBasicDetailsOpen(true);
      return;
    }
    setErrors({});

    // 2. Additional Mode-Specific Validations
    if (mode === 'variable' && variantsList.length === 0) {
      toast.error('Please add at least one variant before publishing.');
      return;
    }

    if (mode === 'single') {
      const sResult = variantSchema.safeParse({
        ...singleVariant,
        title: 'Default',
        stocks: singleVariant.stockStatus === 'Out of Stock' ? '0' : singleVariant.stocks
      });
      if (!sResult.success) {
        const fieldErrors: Record<string, string> = {};
        sResult.error.issues?.forEach(err => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setVariantErrors(fieldErrors);
        toast.error('Please fix pricing/stock errors.');
        return;
      }
      
      // Custom Tax Validation removed as dropdown is used.

      // 2.2 Duplicate Attribute Check for Single Mode
      const singleAttrKeys = singleVariant.attributes.map(a => a.name.trim()).filter(Boolean);
      if (new Set(singleAttrKeys).size !== singleAttrKeys.length) {
        toast.error('Duplicate attribute names are not allowed.');
        return;
      }

      // 2.1 Mandatory Image Validation for Single Mode
      if (mode === 'single' && !singleVariant.image && !singleVariant.imagePreview) {
        setErrors(prev => ({ ...prev, image: 'Product cover image is required.' }));
        toast.error('Product cover image is required.');
        return;
      }
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.image;
        return newErrors;
      });
    } else {
      // Custom Tax Validation removed as dropdown is used.
    }
    setVariantErrors({});

    setIsSubmitting(true);
    const publishId = toast.loading('Publishing product...');
    try {
      let productId = currentProductId;
      
      // 3. Create or Update Product Basic Details
      const productFormData = new FormData();
      Object.entries(basicData).forEach(([key, value]) => {
        if (!productId && key === 'isActive') return; // Skip isActive for creation
        productFormData.append(key, String(value));
      });
      productFormData.append('specs', JSON.stringify(specs.filter(s => s.key.trim() && s.value.trim())));
      
      

      // Gallery images (imagesArray) are handled at the Variant level.
      // We don't append them to productFormData here to avoid redundant payload.

      // Add mode-specific Tax Settings
      if (mode === 'single') {
        productFormData.append('isTaxInclude', singleVariant.taxIncluded === 'yes' ? 'true' : 'false');
        productFormData.append('taxes', JSON.stringify(
          singleVariant.taxIncluded === 'no' 
            ? [{ name: singleVariant.taxRate === '0' ? 'Exempted' : 'GST', slab: Number(singleVariant.taxRate) }] 
            : []
        ));
      } else {
        productFormData.append('isTaxInclude', globalTaxData.taxIncluded === 'yes' ? 'true' : 'false');
        productFormData.append('taxes', JSON.stringify(
          globalTaxData.taxIncluded === 'no' 
            ? [{ name: globalTaxData.taxRate === '0' ? 'Exempted' : 'GST', slab: Number(globalTaxData.taxRate) }] 
            : []
        ));
      }

      if (productId) {
        await updateProductMutation.mutateAsync({ id: productId, formData: productFormData });
      } else {
        const productResult = await createProductMutation.mutateAsync(productFormData);
        productId = productResult._id || productResult.id;
        setCurrentProductId(productId);
      }

      // 2. If Single Mode, create the default variant now
      if (mode === 'single') {
        const variantFormData = new FormData();
        variantFormData.append('productId', productId!);
        variantFormData.append('title', basicData.title);
        variantFormData.append('sku', singleVariant.sku);
        variantFormData.append('price', singleVariant.price);
        variantFormData.append('mrp', singleVariant.mrp);
        
        const finalStocks = singleVariant.stockStatus === 'Out of Stock' ? '0' : singleVariant.stocks;
        variantFormData.append('stocks', finalStocks);

        // Convert Attribute[] to Record<string, string>
        const attributesRecord: Record<string, string> = {};
        singleVariant.attributes.forEach(attr => {
          if (attr.name.trim() && attr.value.trim()) {
            attributesRecord[attr.name.trim()] = attr.value.trim();
          }
        });

        variantFormData.append('attributes', JSON.stringify({ 
          type: 'single', 
          ...attributesRecord
        }));
        variantFormData.append('discount', JSON.stringify({
          type: singleVariant.discountType,
          value: Number(singleVariant.discount) || 0
        }));
        variantFormData.append('isDefault', 'true');
        if (singleVariant.image) variantFormData.append('coverImage', singleVariant.image);
        singleVariant.additionalImages.forEach(img => variantFormData.append('imagesArray', img));
        removedImagesPublicIds.forEach(id => variantFormData.append('removedImagesPublicIds', id));
        
        // If editing an existing single product, update the variant instead of creating a new one
        if (singleVariant.id) {
          await updateVariantMutation.mutateAsync({ id: singleVariant.id, formData: variantFormData });
        } else {
          await createVariantMutation.mutateAsync(variantFormData);
        }
      }

      // 3. Final Step: Flip the isPublished flag
      await publishProductMutation.mutateAsync(productId!);

      toast.success('Product published successfully!', { id: publishId });
      setRemovedImagesPublicIds([]);
      onBack();
    } catch (error) {
      console.error('Submission failed:', error);
      toast.error('Failed to publish product.', { id: publishId });
    } finally {
      setIsSubmitting(false);
    }
  };
const handleSaveDraft = async () => {
  // For drafts, we at least require a title to identify it
  if (!basicData.title) {
    setErrors({ title: 'Product title is required to save a draft.' });
    toast.error('Product title is required.');
    return;
  }
  setErrors({});

  setIsSubmitting(true);
  const draftId = toast.loading('Saving draft...');
  try {
    // 2. Duplicate Attribute Check for Draft
    const draftAttrKeys = mode === 'single' 
      ? singleVariant.attributes.map(a => a.name.trim()).filter(Boolean)
      : currentVariant.attributes.map(a => a.name.trim()).filter(Boolean);
    
    if (new Set(draftAttrKeys).size !== draftAttrKeys.length) {
      toast.error('Duplicate attribute names are not allowed.', { id: draftId });
      setIsSubmitting(false);
      return;
    }

    let productId = currentProductId;

    const productFormData = new FormData();
    Object.entries(basicData).forEach(([key, value]) => {
      if (!productId && key === 'isActive') return; // Skip isActive for creation
      productFormData.append(key, String(value));
    });
    productFormData.append('specs', JSON.stringify(specs.filter(s => s.key.trim() && s.value.trim())));
    
    // Gallery images (imagesArray) are handled at the Variant level.
      
    // Add mode-specific Tax Settings for Draft
      if (mode === 'single') {
        productFormData.append('isTaxInclude', singleVariant.taxIncluded === 'yes' ? 'true' : 'false');
        productFormData.append('taxes', JSON.stringify(
          singleVariant.taxIncluded === 'no' 
            ? [{ name: singleVariant.taxRate === '0' ? 'Exempted' : 'GST', slab: Number(singleVariant.taxRate) }] 
            : []
        ));
      } else {
        productFormData.append('isTaxInclude', globalTaxData.taxIncluded === 'yes' ? 'true' : 'false');
        productFormData.append('taxes', JSON.stringify(
          globalTaxData.taxIncluded === 'no' 
            ? [{ name: globalTaxData.taxRate === '0' ? 'Exempted' : 'GST', slab: Number(globalTaxData.taxRate) }] 
            : []
        ));
      }
      
      // Explicitly keep isPublished false for drafts
      productFormData.append('isPublished', 'false');

      if (productId) {
        await updateProductMutation.mutateAsync({ id: productId, formData: productFormData });
      } else {
        const productResult = await createProductMutation.mutateAsync(productFormData);
        productId = productResult._id || productResult.id;
        setCurrentProductId(productId);
      }

      // Save variant info for single mode drafts
      if (mode === 'single') {
        const variantFormData = new FormData();
        variantFormData.append('productId', productId!);
        variantFormData.append('title', basicData.title);
        variantFormData.append('sku', singleVariant.sku);
        variantFormData.append('price', singleVariant.price);
        variantFormData.append('mrp', singleVariant.mrp);
        
        const finalStocks = singleVariant.stockStatus === 'Out of Stock' ? '0' : singleVariant.stocks;
        variantFormData.append('stocks', finalStocks);

        const attributesRecord: Record<string, string> = {};
        singleVariant.attributes.forEach(attr => {
          if (attr.name.trim() && attr.value.trim()) {
            attributesRecord[attr.name.trim()] = attr.value.trim();
          }
        });

        variantFormData.append('attributes', JSON.stringify({ 
          type: 'single', 
          ...attributesRecord
        }));
        variantFormData.append('discount', JSON.stringify({
          type: singleVariant.discountType,
          value: Number(singleVariant.discount) || 0
        }));
        variantFormData.append('isDefault', 'true');
        if (singleVariant.image) variantFormData.append('coverImage', singleVariant.image);
        singleVariant.additionalImages.forEach(img => variantFormData.append('imagesArray', img));
        removedImagesPublicIds.forEach(id => variantFormData.append('removedImagesPublicIds', id));

        if (singleVariant.id) {
          await updateVariantMutation.mutateAsync({ id: singleVariant.id, formData: variantFormData });
        } else {
          await createVariantMutation.mutateAsync(variantFormData);
        }
        }
      toast.success('Draft saved successfully!', { id: draftId });
      setRemovedImagesPublicIds([]);
      onBack();
    } catch (error) {
      console.error('Draft save failed:', error);
      toast.error('Failed to save draft.', { id: draftId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] text-[#1a1a1a]">
      {/* Top Header */}
      {/* <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {product ? 'Edit Product' : 'Add New Product'}
            </h1>
          </div>
        </div>
      </div> */}

      {/* Main Form Content - 50/50 Split */}
      <div className="p-4 md:p-6 pb-32 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="space-y-6">
          
          {/* Basic Details (Collapsible) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button 
              onClick={() => setIsBasicDetailsOpen(!isBasicDetailsOpen)}
              className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-800">Basic Details</h3>
              {isBasicDetailsOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
            </button>
            
            {isBasicDetailsOpen && (
              <div className="p-5 pt-0 space-y-5 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name</label>
                  <input 
                    type="text" 
                    value={basicData.title}
                    onChange={(e) => setBasicData({...basicData, title: e.target.value})}
                    placeholder="e.g. Bridal set"
                    className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D] ${errors.title ? 'border-red-500' : ''}`}
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative" ref={brandRef}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand Name</label>
                    <input 
                      type="text"
                      value={brandSearch}
                      onChange={(e) => {
                        setBrandSearch(e.target.value);
                        setShowBrandResults(true);
                      }}
                      onFocus={() => setShowBrandResults(true)}
                      placeholder="Search brand..."
                      className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D] ${errors.brandId ? 'border-red-500' : ''}`}
                    />
                    {errors.brandId && <p className="text-red-500 text-xs mt-1">{errors.brandId}</p>}
                    {showBrandResults && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {brandSearch.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            Enter at least 1 character to get brand suggestion
                          </div>
                        ) : isBrandsLoading ? (
                          <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" size={16} /> Searching...
                          </div>
                        ) : brands && brands.length > 0 ? (
                          brands.map((b: Brand) => (
                            <div 
                              key={b.id}
                              onClick={() => {
                                setBasicData({...basicData, brandId: b.id});
                                setBrandSearch(b.name);
                                setShowBrandResults(false);
                              }}
                              className="p-3 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0 border-gray-100"
                            >
                              {b.name}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">No brands found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Root Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                    <select 
                      value={categoryPath[0] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newPath = val ? [val] : [];
                        setCategoryPath(newPath);
                        setBasicData({...basicData, categoryId: val});
                      }}
                      className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm ${errors.categoryId ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select category</option>
                      {categoryTree?.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
                  </div>

                  {/* Sub Categories */}
                  {categoryPath.map((id, index) => {
                    // Find the category at this level to see if it has children
                    let currentLevelOptions: Category[] | undefined = categoryTree;
                    for (let i = 0; i <= index; i++) {
                      currentLevelOptions = currentLevelOptions?.find(c => c.id === categoryPath[i])?.children;
                    }

                    if (!currentLevelOptions || currentLevelOptions.length === 0) return null;

                    return (
                      <div key={index} className={index % 2 === 0 ? 'md:col-span-1' : 'md:col-span-1'}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          {index === 0 ? 'Sub Category' : `Level ${index + 2} Category`}
                        </label>
                        <select 
                          value={categoryPath[index + 1] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newPath = [...categoryPath.slice(0, index + 1)];
                            if (val) {
                              newPath.push(val);
                              setBasicData({...basicData, categoryId: val});
                            } else {
                              setBasicData({...basicData, categoryId: categoryPath[index]});
                            }
                            setCategoryPath(newPath);
                            }}
                            className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm ${errors.categoryId ? 'border-red-500' : ''}`}
                            >
                            <option value="">Select sub category</option>                          {currentLevelOptions.map((c: Category) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Description</label>
                  <RichTextEditor 
                    content={basicData.desc}
                    onChange={(content) => setBasicData({...basicData, desc: content})}
                    placeholder="Describe the product..."
                    error={!!errors.desc}
                  />
                  {errors.desc && <p className="text-red-500 text-xs mt-1">{errors.desc}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Key Features</label>
                  <div className="space-y-3">
                    {specs.map((spec, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input 
                            type="text" value={spec.key} placeholder="Feature Name"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D]"
                            onChange={(e) => {
                              const newSpecs = [...specs]; newSpecs[index].key = e.target.value; setSpecs(newSpecs);
                            }}
                          />
                          <input 
                            type="text" value={spec.value} placeholder="Details..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D] text-gray-500"
                            onChange={(e) => {
                              const newSpecs = [...specs]; newSpecs[index].value = e.target.value; setSpecs(newSpecs);
                            }}
                          />
                        </div>
                        <button 
                          onClick={() => removeSpec(index)} 
                          className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title="Remove feature"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    <button onClick={addSpec} className="text-[#44937D] text-sm font-semibold flex items-center gap-1 mt-2 hover:underline">
                      <Plus size={16} /> Add Feature
                    </button>
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pickup Address</label>
                   <select 
                     value={basicData.pickupWareHouseId}
                     onChange={(e) => setBasicData({...basicData, pickupWareHouseId: e.target.value})}
                     className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm ${errors.pickupWareHouseId ? 'border-red-500' : ''}`}
                   >
                     <option value="">Select Pickup Address</option>
                     {warehouses?.map((w: Warehouse) => <option key={w.id} value={w.id}>{w.name}</option>)}
                   </select>
                   {errors.pickupWareHouseId && <p className="text-red-500 text-xs mt-1">{errors.pickupWareHouseId}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Return Policy</label>
                    <select 
                      value={basicData.returnPolicyType}
                      onChange={(e) => setBasicData({...basicData, returnPolicyType: e.target.value})}
                      className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm ${errors.returnPolicyType ? 'border-red-500' : ''}`}
                    >
                      <option value="REPLACE">Replacement Only</option>
                      <option value="RETURN">Return Only</option>
                      <option value="BOTH">Both (Return & Replace)</option>
                      <option value="NONE">No Returns/Replacement</option>
                    </select>
                    {errors.returnPolicyType && <p className="text-red-500 text-xs mt-1">{errors.returnPolicyType}</p>}
                  </div>
                  {basicData.returnPolicyType !== 'NONE' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Return Window (Days)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={basicData.returnWindowDays}
                        onChange={(e) => setBasicData({...basicData, returnWindowDays: parseInt(e.target.value) || 0})}
                        className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D] ${errors.returnWindowDays ? 'border-red-500' : ''}`}
                      />
                      {errors.returnWindowDays && <p className="text-red-500 text-xs mt-1">{errors.returnWindowDays}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Product Type Toggle */}
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1 border border-gray-200">
            <button 
              type="button"
              disabled={mode === 'variable' && (product !== null || variantsList.length > 0)}
              title={mode === 'variable' && (product !== null || variantsList.length > 0) ? 'Cannot switch back to Single Product once variations are added or in edit mode' : ''}
              onClick={() => {
                if (mode === 'variable' && variantsList.length > 1) {
                  const confirm = window.confirm('Switching to Single Product will only keep your default variant in this view. Other variants will be hidden. Continue?');
                  if (!confirm) return;
                }
                
                // Sync Variable -> Single
                if (mode === 'variable') {
                  const def = variantsList.find(v => v.isDefault) || variantsList[0];
                  if (def) {
                    setSingleVariant({
                      id: def.id || '',
                      sku: def.sku,
                      stocks: def.stocks,
                      stockStatus: def.stockStatus || (parseInt(def.stocks) > 0 ? 'In Stock' : 'Out of Stock'),
                      price: def.price,
                      mrp: def.mrp,
                      discount: def.discount,
                      discountType: (def.discountType as 'percentage' | 'flat') || 'percentage',
                      taxSlab: def.taxSlab || '',
                      taxIncluded: globalTaxData.taxIncluded,
                      taxRate: globalTaxData.taxRate,
                      attributes: def.attributes,
                      image: def.image || null,
                      imagePreview: def.imagePreview || null,
                      additionalImages: def.additionalImages || [],
                      additionalPreviews: def.additionalPreviews || []
                    });
                  }
                }

                setMode('single');
                setErrors({});
                setVariantErrors({});
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                mode === 'single' ? 'bg-white shadow-sm text-[#44937D]' : 'text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <div className={`w-3 h-3 border border-current rounded-sm ${mode === 'single' ? 'bg-[#44937D] border-[#44937D]' : ''}`}></div> Single Product
            </button>
            <button 
              onClick={() => {
                // Sync Single -> Variable
                if (mode === 'single') {
                  // Move current single data to the variants list
                  const newVariant: FormVariant = {
                    title: basicData.title || 'Default Variant',
                    sku: singleVariant.sku,
                    stocks: singleVariant.stocks,
                    stockStatus: singleVariant.stockStatus,
                    price: singleVariant.price,
                    mrp: singleVariant.mrp,
                    discount: singleVariant.discount,
                    discountType: singleVariant.discountType,
                    taxSlab: singleVariant.taxSlab,
                    taxIncluded: singleVariant.taxIncluded,
                    taxRate: singleVariant.taxRate,
                    attributes: singleVariant.attributes,
                    image: singleVariant.image,
                    imagePreview: singleVariant.imagePreview,
                    additionalImages: singleVariant.additionalImages,
                    additionalPreviews: singleVariant.additionalPreviews,
                    isDefault: true,
                    id: singleVariant.id || variantsData?.[0]?.id 
                  };

                  // Auto-populate the actual variants list
                  // We ONLY do this if we are in EDIT mode (product exists) to avoid losing the existing single variant data.
                  // In ADD mode, we want the user to explicitly "Add Variant" to avoid unwanted placeholders.
                  if (product && (variantsList.length === 0 || (variantsList.length === 1 && (variantsList[0].title === 'Default' || variantsList[0].title === basicData.title)))) {
                    setVariantsList([newVariant]);

                    // Also sync Global Tax
                    setGlobalTaxData({
                      taxIncluded: singleVariant.taxIncluded,
                      taxRate: singleVariant.taxRate
                    });
                  }

                  // Clear the current variant form so user can add a NEW variant
                  setCurrentVariant({
                    title: '',
                    sku: '',
                    stocks: '0',
                    stockStatus: 'In Stock',
                    price: '',
                    mrp: '',
                    discount: '',
                    discountType: 'percentage',
                    attributes: [{ name: '', value: '' }],
                    image: null,
                    imagePreview: null,
                    additionalImages: [],
                    additionalPreviews: []
                  });
                }

                setMode('variable');
                setErrors({});
                setVariantErrors({});
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'variable' ? 'bg-white shadow-sm text-[#44937D]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <div className={`w-3 h-3 rounded-full border border-current ${mode === 'variable' ? 'bg-[#44937D] border-[#44937D]' : ''}`}></div> Variable Product
            </button>
          </div>

          {/* SINGLE PRODUCT SPECIFIC LEFT FIELDS */}
          {mode === 'single' && (
            <div className="space-y-6">
               <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-800">Inventory</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock Status</label>
                      <select 
                        value={singleVariant.stockStatus}
                        onChange={(e) => setSingleVariant({...singleVariant, stockStatus: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D]"
                      >
                        <option value="In Stock">In Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                      </select>
                    </div>
                    {singleVariant.stockStatus === 'In Stock' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock Quantity</label>
                        <input 
                          type="number" 
                          min="0"
                          value={singleVariant.stocks} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setSingleVariant({...singleVariant, stocks: isNaN(val) ? '0' : Math.max(0, val).toString()});
                          }} 
                          className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D] ${variantErrors.stocks ? 'border-red-500' : ''}`} 
                        />
                        {variantErrors.stocks && <p className="text-red-500 text-xs mt-1">{variantErrors.stocks}</p>}
                      </div>
                    )}
                  </div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-800">Attributes</h4>
                  <div className="space-y-3">
                    {singleVariant.attributes.map((attr, index) => {
                   const allKeys = PREDEFINED_ATTRIBUTES.flatMap(g => g.keys);
                   const isPredefined = allKeys.includes(attr.name);
                   const isOther = attr.name !== '' && !isPredefined;

                   const otherRowsKeys = singleVariant.attributes
                     .filter((_, i) => i !== index)
                     .map(a => a.name)
                     .filter(Boolean);

                   const isDuplicate = attr.name !== '' && otherRowsKeys.includes(attr.name);

                   return (
                     <div key={index} className={`flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border transition-all hover:border-[#44937D]/30 ${isDuplicate ? 'border-red-300 bg-red-50/30' : 'border-gray-200 shadow-sm'}`}>
                       <div className="flex gap-3 items-center">
                         <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <div className="flex flex-col gap-1.5">
                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Attribute Name</label>
                             <select 
                               value={isOther ? 'Other' : attr.name}
                               className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D]"
                               onChange={(e) => {
                                 const val = e.target.value;
                                 updateSingleAttribute(index, 'name', val);
                               }}
                             >
                               <option value="">Select Attribute</option>
                               {PREDEFINED_ATTRIBUTES.map(group => (
                                 <optgroup key={group.group} label={group.group}>
                                   {group.keys.map(key => (
                                     <option key={key} value={key} disabled={otherRowsKeys.includes(key)}>{key}</option>
                                   ))}
                                 </optgroup>
                               ))}
                               <option value="Other">Other (Custom)</option>
                             </select>
                           </div>
                           <div className="flex flex-col gap-1.5">
                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Value</label>
                             <input 
                               type="text" value={attr.value} placeholder="e.g. 22KT"
                               className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D]"
                               onChange={(e) => updateSingleAttribute(index, 'value', e.target.value)}
                             />
                           </div>
                         </div>
                         <button 
                           onClick={() => removeSingleAttribute(index)} 
                           className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 mt-5"
                           title="Remove attribute"
                         >
                           <Trash2 size={18} />
                         </button>
                       </div>
                       {(isOther || attr.name === 'Other') ? (
                         <div className="flex flex-col gap-1.5 px-1 pt-1 border-t border-gray-100 mt-1">
                           <label className="text-[10px] font-bold text-[#44937D] uppercase tracking-wider">Custom Attribute Name</label>
                           <input 
                             type="text" 
                             value={attr.name === 'Other' ? '' : attr.name} 
                             placeholder="Enter custom attribute name..."
                             className={`w-full bg-white border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D] ${isDuplicate ? 'border-red-500' : 'border-gray-200'}`}
                             onChange={(e) => updateSingleAttribute(index, 'name', e.target.value)}
                           />
                           {isDuplicate && <p className="text-[10px] text-red-500 font-bold">This attribute name is already in use.</p>}
                         </div>
                       ) : isDuplicate ? (
                          <p className="text-[10px] text-red-500 font-bold px-1">This attribute is already selected.</p>
                       ) : null}
                     </div>
                   );
                 })}
                 <button 
                   onClick={addSingleAttribute} 
                   className="text-[#44937D] text-sm font-semibold flex items-center gap-1 hover:underline"
                 >
                   <Plus size={16} /> Add Attribute
                 </button>
               </div>                  
                  {/* SKU integrated into Attributes for Single Mode */}
                  <div className="pt-4 border-t border-gray-100">
                    <label className="flex justify-between items-center text-sm font-semibold text-gray-700 mb-1.5">
                      SKU (Stock Keeping Unit)
                      <button 
                        type="button"
                        onClick={() => setIsSkuLocked(!isSkuLocked)}
                        className="text-[#44937D] text-xs font-semibold hover:underline"
                      >
                        {isSkuLocked ? 'Unlock to edit' : 'Lock SKU'}
                      </button>
                    </label>
                    <input 
                      type="text" 
                      value={singleVariant.sku} 
                      readOnly={isSkuLocked}
                      onChange={(e) => setSingleVariant({...singleVariant, sku: e.target.value.toUpperCase()})} 
                      placeholder="e.g. JEW-RING-001" 
                      className={`w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-1 focus:outline-none transition-colors ${isSkuLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50 focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D]'} ${variantErrors.sku ? 'border-red-500' : ''}`} 
                    />
                    {variantErrors.sku && <p className="text-red-500 text-xs mt-1">{variantErrors.sku}</p>}
                    <p className="text-xs text-gray-400">
                      {isSkuLocked ? 'Auto-generated from brand, category & attributes.' : 'Manually editing SKU.'}
                    </p>
                  </div>
               </div>
            </div>
          )}

          {/* VARIABLE PRODUCT SPECIFIC LEFT FIELDS */}
          {mode === 'variable' && (
             <div className="space-y-6 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
               <h4 className="text-lg font-bold text-gray-800">Variable Product Details</h4>
               
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Variant Name</label>
                  <input type="text" value={currentVariant.title} onChange={(e) => setCurrentVariant({...currentVariant, title: e.target.value})} placeholder="e.g. Space Gray - 256GB" className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D] ${variantErrors.title ? 'border-red-500' : ''}`} />
                  {variantErrors.title && <p className="text-red-500 text-xs mt-1">{variantErrors.title}</p>}
               </div>

               <div className="space-y-4 border-t border-gray-100 pt-4">
                  <h4 className="text-lg font-bold text-gray-800">Pricing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="md:col-span-2">
                       <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product MRP</label>
                       <div className="flex">
                         <div className="bg-gray-100 border border-r-0 border-gray-200 px-4 py-2.5 rounded-l-lg text-sm text-gray-500">₹</div>
                         <input type="number" value={currentVariant.mrp} onChange={(e) => handleVariantPricingChange('mrp', e.target.value)} placeholder="0" className={`w-full bg-gray-50 border border-gray-200 rounded-r-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D] ${variantErrors.mrp ? 'border-red-500' : ''}`} />
                       </div>
                       {variantErrors.mrp && <p className="text-red-500 text-xs mt-1">{variantErrors.mrp}</p>}
                     </div>
                     <div>
                       <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount</label>
                       <div className="flex">
                         <input 
                           type="number" 
                           value={currentVariant.discount} 
                           onChange={(e) => handleVariantPricingChange('discount', e.target.value)} 
                           placeholder="0" 
                           className="w-full bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D]" 
                         />
                         <select 
                           value={currentVariant.discountType}
                           onChange={(e) => handleVariantPricingChange('discountType', e.target.value)}
                           className="bg-gray-100 border border-gray-200 rounded-r-lg px-2 py-2.5 text-xs font-bold text-gray-600 focus:outline-none"
                         >
                           <option value="percentage">%</option>
                           <option value="flat">₹</option>
                         </select>
                       </div>
                     </div>
                     <div>
                       <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount Price</label>
                       <div className="flex">
                         <div className="bg-gray-100 border border-r-0 border-gray-200 px-4 py-2.5 rounded-l-lg text-sm text-gray-500">₹</div>
                         <input type="number" value={currentVariant.price} onChange={(e) => handleVariantPricingChange('price', e.target.value)} placeholder="0" className={`w-full bg-gray-50 border border-gray-200 rounded-r-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D] ${variantErrors.price ? 'border-red-500' : ''}`} />
                       </div>
                       {variantErrors.price && <p className="text-red-500 text-xs mt-1">{variantErrors.price}</p>}
                     </div>
                  </div>
               </div>

               <div className="space-y-4 border-t border-gray-100 pt-4">
                  <h4 className="text-lg font-bold text-gray-800">Attributes</h4>
                  <div className="space-y-3">
                    {currentVariant.attributes.map((attr, index) => {
                      const allKeys = PREDEFINED_ATTRIBUTES.flatMap(g => g.keys);
                      const isPredefined = allKeys.includes(attr.name);
                      const isOther = attr.name !== '' && !isPredefined;
                      
                      const otherRowsKeys = currentVariant.attributes
                        .filter((_, i) => i !== index)
                        .map(a => a.name)
                        .filter(Boolean);
                      
                      const isDuplicate = attr.name !== '' && otherRowsKeys.includes(attr.name);

                      return (
                        <div key={index} className={`flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border transition-all hover:border-[#44937D]/30 ${isDuplicate ? 'border-red-300 bg-red-50/30' : 'border-gray-200 shadow-sm'}`}>
                          <div className="flex gap-3 items-center">
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Attribute Name</label>
                                <select 
                                  value={isOther ? 'Other' : attr.name}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D]"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateVariantAttribute(index, 'name', val);
                                  }}
                                >
                                  <option value="">Select Attribute</option>
                                  {PREDEFINED_ATTRIBUTES.map(group => (
                                    <optgroup key={group.group} label={group.group}>
                                      {group.keys.map(key => (
                                        <option key={key} value={key} disabled={otherRowsKeys.includes(key)}>{key}</option>
                                      ))}
                                    </optgroup>
                                  ))}
                                  <option value="Other">Other (Custom)</option>
                                </select>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Value</label>
                                <input 
                                  type="text" value={attr.value} placeholder="e.g. Medium"
                                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D]"
                                  onChange={(e) => updateVariantAttribute(index, 'value', e.target.value)}
                                />
                              </div>
                            </div>
                            <button 
                              onClick={() => removeVariantAttribute(index)} 
                              className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 mt-5"
                              title="Remove attribute"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          {(isOther || attr.name === 'Other') ? (
                            <div className="flex flex-col gap-1.5 px-1 pt-1 border-t border-gray-100 mt-1">
                              <label className="text-[10px] font-bold text-[#44937D] uppercase tracking-wider">Custom Attribute Name</label>
                              <input 
                                type="text" 
                                value={attr.name === 'Other' ? '' : attr.name} 
                                placeholder="Enter custom attribute name..."
                                className={`w-full bg-white border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D] ${isDuplicate ? 'border-red-500' : 'border-gray-200'}`}
                                onChange={(e) => updateVariantAttribute(index, 'name', e.target.value)}
                              />
                              {isDuplicate && <p className="text-[10px] text-red-500 font-bold">This attribute name is already in use.</p>}
                            </div>
                          ) : isDuplicate ? (
                             <p className="text-[10px] text-red-500 font-bold px-1">This attribute is already selected.</p>
                          ) : null}
                        </div>
                      );
                    })}
                    <button 
                      onClick={addVariantAttribute} 
                      className="text-[#44937D] text-sm font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Plus size={16} /> Add Attribute
                    </button>
                  </div>

                  {/* SKU integrated into Attributes for Variable Mode */}
                  <div className="pt-4 border-t border-gray-100">
                    <label className="flex justify-between items-center text-sm font-semibold text-gray-700 mb-1.5">
                      SKU
                      <button 
                        type="button"
                        onClick={() => setIsVariantSkuLocked(!isVariantSkuLocked)}
                        className="text-[#44937D] text-xs font-semibold hover:underline"
                      >
                        {isVariantSkuLocked ? 'Unlock to edit' : 'Lock SKU'}
                      </button>
                    </label>
                    <input 
                      type="text" 
                      value={currentVariant.sku} 
                      readOnly={isVariantSkuLocked}
                      onChange={(e) => setCurrentVariant({...currentVariant, sku: e.target.value.toUpperCase()})} 
                      placeholder="e.g. JEW-NECK-001" 
                      className={`w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors ${isVariantSkuLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50 focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D]'} ${variantErrors.sku ? 'border-red-500' : ''}`} 
                    />
                    {variantErrors.sku && <p className="text-red-500 text-xs mt-1">{variantErrors.sku}</p>}
                  </div>
               </div>

               <div className="space-y-4 border-t border-gray-100 pt-4">
                  <h4 className="text-lg font-bold text-gray-800">Inventory</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock Status</label>
                      <select 
                        value={currentVariant.stockStatus}
                        onChange={(e) => setCurrentVariant({...currentVariant, stockStatus: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D]"
                      >
                        <option value="In Stock">In Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                      </select>
                    </div>
                    {currentVariant.stockStatus === 'In Stock' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock Quantity</label>
                        <input 
                          type="number" 
                          min="0"
                          value={currentVariant.stocks} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setCurrentVariant({...currentVariant, stocks: isNaN(val) ? '0' : Math.max(0, val).toString()});
                          }} 
                          className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D] ${variantErrors.stocks ? 'border-red-500' : ''}`} 
                        />
                        {variantErrors.stocks && <p className="text-red-500 text-xs mt-1">{variantErrors.stocks}</p>}
                      </div>
                    )}
                  </div>
               </div>

               <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
                 {editingVariantIndex !== null && (
                   <button
                    type="button"
                    onClick={() => {
                      setCurrentVariant({
                        title: '',
                        sku: '',
                        stocks: '0',
                        stockStatus: 'In Stock',
                        price: '',
                        mrp: '',
                        discount: '',
                        discountType: 'percentage',
                        attributes: [{ name: '', value: '' }],
                        image: null,
                        imagePreview: null,
                        additionalImages: [],
                        additionalPreviews: []
                      });
                      setEditingVariantIndex(null);
                      setIsVariantSkuLocked(true);
                      setVariantErrors({});
                    }}
                    className="px-6 py-2.5 text-gray-500 hover:text-gray-700 font-semibold text-sm transition-all"
                   >
                     Cancel
                   </button>
                 )}
                 <button 
                  onClick={handleAddVariant}
                  disabled={isAddingVariant}
                  className="px-6 py-2.5 bg-[#44937D] text-white rounded-lg text-sm font-bold hover:bg-[#367966] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                 >
                   {isAddingVariant ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} 
                   {editingVariantIndex !== null ? 'Update Variant' : 'Add Variant'}
                 </button>
               </div>
             </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="space-y-6">
          
          {/* Upload Product Image Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Upload Product Image</h3>
            
            {/* Main Cover Image Box */}
            <div className={`relative aspect-[4/3] rounded-xl border-2 border-dashed bg-gray-50 flex flex-col items-center justify-center overflow-hidden mb-4 hover:border-[#44937D] transition-colors group ${
              (mode === 'variable' ? variantErrors.image : errors.image) ? 'border-red-500 bg-red-50/30' : 'border-gray-200'
            }`}>
              {(mode === 'variable' ? currentVariant.imagePreview : singleVariant.imagePreview) ? (
                <img 
                  src={mode === 'variable' ? currentVariant.imagePreview! : singleVariant.imagePreview!} 
                  alt={mode === 'variable' ? "Variant" : "Cover"} 
                  className="w-full h-full object-contain p-4 bg-white" 
                />
              ) : (
                <label className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
                  <ImageIcon size={40} className={`mb-2 group-hover:text-[#44937D] ${
                    (mode === 'variable' ? variantErrors.image : errors.image) ? 'text-red-300' : 'text-gray-300'
                  }`} />
                  <span className={`text-sm font-semibold ${
                    (mode === 'variable' ? variantErrors.image : errors.image) ? 'text-red-400' : 'text-gray-500'
                  }`}>Add Cover Image</span>
                  <p className="text-[10px] text-gray-400 mt-1">Max size: 2MB</p>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error('File size too large. Max 2MB allowed.');
                        return;
                      }
                      if (mode === 'variable') {
                        setCurrentVariant({...currentVariant, image: file, imagePreview: URL.createObjectURL(file)});
                        setVariantErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.image;
                          return newErrors;
                        });
                      } else {
                          setSingleVariant({...singleVariant, image: file, imagePreview: URL.createObjectURL(file)});
                          setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.image;
                          return newErrors;
                        });
                      }
                    }
                  }}/>
                </label>
              )}

              {(mode === 'variable' ? currentVariant.imagePreview : singleVariant.imagePreview) && (
                <div className="absolute top-4 right-4 flex gap-2">
                   <button 
                    onClick={() => {
                      if (mode === 'variable') setCurrentVariant({...currentVariant, image: null, imagePreview: null});
                      else { setSingleVariant({...singleVariant, image: null, imagePreview: null}); }
                    }}
                    className="bg-white border border-gray-200 text-red-500 p-2 rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              )}

              {(mode === 'variable' ? currentVariant.imagePreview : singleVariant.imagePreview) && (
                <div className="absolute bottom-4 right-4">
                   <label className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer shadow-sm hover:bg-gray-50 flex items-center gap-2">
                   <Edit size={14} /> Replace
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error('File size too large. Max 2MB allowed.');
                          return;
                        }
                        if (mode === 'variable') {
                          setCurrentVariant({...currentVariant, image: file, imagePreview: URL.createObjectURL(file)});
                          setVariantErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.image;
                            return newErrors;
                          });
                        } else {
                          setSingleVariant({...singleVariant, image: file, imagePreview: URL.createObjectURL(file)});
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.image;
                            return newErrors;
                          });
                        }
                     }
                   }}/>
                   </label>
                </div>
              )}
            </div>

            {(mode === 'variable' ? variantErrors.image : errors.image) && (
              <p className="text-red-500 text-xs mt-[-8px] mb-4 text-center font-medium">
                {mode === 'variable' ? variantErrors.image : errors.image}
              </p>
            )}

            {/* Thumbnails (for additional images, kept in single mode typically) */}
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((idx) => {
                const preview = mode === 'variable' ? currentVariant.additionalPreviews[idx] : singleVariant.additionalPreviews[idx];
                return (
                  <div key={idx} className="relative aspect-square rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden group">
                    {preview ? (
                      <>
                        <img src={preview} alt="" className="w-full h-full object-contain p-1 bg-white" />
                        <button 
                          onClick={() => {
                            if (mode === 'variable') {
                              const newPreviews = [...currentVariant.additionalPreviews];
                              const newImages = [...currentVariant.additionalImages];
                              
                              // Track removed public ID
                              const removedPreview = newPreviews[idx];
                              if (editingVariantIndex !== null && removedPreview && !removedPreview.startsWith('blob:')) {
                                const variantDataImages = variantsData?.[editingVariantIndex]?.imagesArray;
                                const originalImage = variantDataImages?.find((img: any) => img.url === removedPreview);
                                if (originalImage?.publicId) {
                                  setRemovedImagesPublicIds(prev => [...prev, originalImage.publicId]);
                                }
                              }

                              newPreviews.splice(idx, 1);
                              newImages.splice(idx, 1);
                              setCurrentVariant({...currentVariant, additionalPreviews: newPreviews, additionalImages: newImages});
                            } else {
                              const newPreviews = [...singleVariant.additionalPreviews];
                              const newImages = [...singleVariant.additionalImages];
                              
                              // Track removed public ID for single mode
                              const removedPreview = newPreviews[idx];
                              if (product && removedPreview && !removedPreview.startsWith('blob:')) {
                                const originalImage = product.imagesArray?.find(img => img.url === removedPreview);
                                if (originalImage?.publicId) {
                                  setRemovedImagesPublicIds(prev => [...prev, originalImage.publicId]);
                                }
                              }

                              newPreviews.splice(idx, 1);
                              newImages.splice(idx, 1);
                              setSingleVariant({...singleVariant, additionalPreviews: newPreviews, additionalImages: newImages});
                            }
                          }} 
                          className="absolute top-1 right-1 bg-white/90 border border-gray-200 text-red-500 rounded-lg p-1 shadow-sm hover:bg-white transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                        <ImagePlus size={20} className="text-gray-400 mb-1 group-hover:text-[#44937D]" />
                        <span className="text-[10px] font-semibold text-gray-400 group-hover:text-[#44937D]">Add Image</span>
                        <p className="text-[8px] text-gray-400">Max size: 2MB</p>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              toast.error('File size too large. Max 2MB allowed.');
                              return;
                            }
                            if (mode === 'variable') {
                              const newPreviews = [...currentVariant.additionalPreviews];
                              const newImages = [...currentVariant.additionalImages];
                              newPreviews[idx] = URL.createObjectURL(file);
                              newImages[idx] = file;
                              setCurrentVariant({...currentVariant, additionalPreviews: newPreviews, additionalImages: newImages});
                            } else {
                              const newPreviews = [...singleVariant.additionalPreviews];
                              const newImages = [...singleVariant.additionalImages];
                              newPreviews[idx] = URL.createObjectURL(file);
                              newImages[idx] = file;
                              setSingleVariant({...singleVariant, additionalPreviews: newPreviews, additionalImages: newImages});
                            }
                          }
                        }}/>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PRODUCT TAX SETTINGS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
             <h3 className="text-lg font-bold text-gray-800">Tax Settings</h3>
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tax Included</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="radio" 
                        checked={currentTaxIncluded === 'yes'} 
                        onChange={() => handleTaxIncludedChange('yes')} 
                        className="accent-[#44937D]" 
                      /> Yes
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="radio" 
                        checked={currentTaxIncluded === 'no'} 
                        onChange={() => handleTaxIncludedChange('no')} 
                        className="accent-[#44937D]" 
                      /> No
                    </label>
                  </div>
                </div>

                <div className="pt-2 space-y-3 border-t border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700">Tax Details</label>
                  {currentTaxIncluded === 'yes' ? (
                    <div className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed">
                      {categoryTaxDisplay} (Inherited from Category)
                    </div>
                  ) : (
                    <select 
                      value={currentTaxRate}
                      onChange={(e) => handleTaxRateChange(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D]"
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

          {/* SINGLE PRODUCT SPECIFIC RIGHT FIELDS (Pricing & Publish) */}
          {mode === 'single' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
               <h3 className="text-lg font-bold text-gray-800">Pricing</h3>
               <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product MRP</label>
                    <div className="flex">
                      <div className="bg-gray-100 border border-r-0 border-gray-200 px-4 py-2.5 rounded-l-lg text-sm text-gray-500">₹</div>
                      <input 
                        type="number" 
                        value={singleVariant.mrp} 
                        onChange={(e) => handleSinglePricingChange('mrp', e.target.value)} 
                        placeholder="0.00" 
                        className={`w-full bg-gray-50 border border-gray-200 rounded-r-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D] ${variantErrors.mrp ? 'border-red-500' : ''}`} 
                      />
                    </div>
                    {variantErrors.mrp && <p className="text-red-500 text-xs mt-1">{variantErrors.mrp}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount</label>
                      <div className="flex">
                        <input 
                          type="number" 
                          value={singleVariant.discount} 
                          onChange={(e) => handleSinglePricingChange('discount', e.target.value)} 
                          placeholder="0" 
                          className="w-full bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D]" 
                        />
                        <select 
                          value={singleVariant.discountType}
                          onChange={(e) => handleSinglePricingChange('discountType', e.target.value)}
                          className="bg-gray-100 border border-gray-200 rounded-r-lg px-2 py-2.5 text-xs font-bold text-gray-600 focus:outline-none"
                        >
                          <option value="percentage">%</option>
                          <option value="flat">₹</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount Price</label>
                      <div className="flex">
                        <div className="bg-gray-100 border border-r-0 border-gray-200 px-4 py-2.5 rounded-l-lg text-sm text-gray-500">₹</div>
                        <input 
                          type="number" 
                          value={singleVariant.price} 
                          onChange={(e) => handleSinglePricingChange('price', e.target.value)} 
                          placeholder="0.00" 
                          className={`w-full bg-gray-50 border border-gray-200 rounded-r-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44937D]/20 focus:border-[#44937D] ${variantErrors.price ? 'border-red-500' : ''}`} 
                        />
                      </div>
                      {variantErrors.price && <p className="text-red-500 text-xs mt-1">{variantErrors.price}</p>}
                    </div>
                  </div>
               </div>
               
               {/* Checkboxes (UI Only mock per image) */}
               {/* <div className="space-y-2 py-4 border-b border-dashed border-gray-200">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600"><input type="checkbox" className="accent-[#44937D] w-4 h-4 rounded" /> Highlight this product in a Best Seller tag.</label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600"><input type="checkbox" className="accent-[#44937D] w-4 h-4 rounded" /> Highlight this product in a Feature tag.</label>
               </div> */}

               {/* Action Buttons */}
               <div className="flex justify-end gap-3 pt-2">
                  <button 
                    onClick={handlePublish} 
                    disabled={isSubmitting || (product !== null && !isDirty)}
                    className="px-8 py-2.5 bg-[#44937D] text-white rounded-lg text-sm font-bold hover:bg-[#367966] transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (product ? 'Update Product' : 'Publish Product')}
                  </button>
               </div>
            </div>
          )}

          {/* VARIABLE PRODUCT SPECIFIC RIGHT FIELDS (Variants List & Publish) */}
          {mode === 'variable' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <h3 className="text-lg font-bold text-gray-800">Final Variable Products List</h3>
              
              <div className="space-y-3">
                {variantsList.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    No variants added yet. Add variants from the left panel.
                  </div>
                ) : (
                  variantsList.map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded border border-gray-200 overflow-hidden flex items-center justify-center">
                          {v.imagePreview ? <img src={v.imagePreview} className="w-full h-full object-contain" alt=""/> : <ImageIcon size={20} className="text-gray-300" />}
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-800 text-sm">{v.title}</h5>
                          <p className="text-xs text-gray-500 mt-0.5">Stock: {v.stocks} &bull; SKU: <span className="font-mono text-[#44937D]">{v.sku}</span></p>
                          <p className="text-xs font-bold mt-1">₹{v.price}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-500">
                          Default
                          <div onClick={() => toggleDefaultVariant(i)}>
                            {v.isDefault ? <ToggleRight size={28} className="text-[#44937D]" /> : <ToggleLeft size={28} className="text-gray-300" />}
                          </div>
                        </label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              const v = variantsList[i];
                              setCurrentVariant({
                                title: v.title,
                                sku: v.sku,
                                stocks: v.stocks,
                                stockStatus: v.stockStatus || (parseInt(v.stocks) > 0 ? 'In Stock' : 'Out of Stock'),
                                price: v.price,
                                mrp: v.mrp,
                                discount: v.discount,
                                discountType: (v.discountType as 'percentage' | 'flat') || 'percentage',
                                attributes: v.attributes || [{ name: '', value: '' }],
                                image: v.image,
                                imagePreview: v.imagePreview,
                                additionalImages: v.additionalImages || [],
                                additionalPreviews: v.additionalPreviews || []
                              });
                              setEditingVariantIndex(i);
                              setIsVariantSkuLocked(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-[#44937D] hover:text-[#367966]"
                          >
                            <Edit size={16} />
                          </button>
                          <button onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600">
                             <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <button 
                    onClick={handleSaveDraft} disabled={isSubmitting}
                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <span className="w-4 h-4 rounded border border-current flex items-center justify-center text-[10px]">✓</span>}
                    Save to draft
                  </button>
                  <button 
                    onClick={handlePublish} 
                    disabled={isSubmitting || variantsList.length === 0 || (product !== null && !isDirty)}
                    className="px-8 py-2.5 bg-[#44937D] text-white rounded-lg text-sm font-bold hover:bg-[#367966] transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (product ? 'Update Product' : 'Publish Product')}
                  </button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}