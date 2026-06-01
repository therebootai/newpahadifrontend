'use client';

import { useRouter, useParams } from 'next/navigation';
import ProductForm from '../../components/ProductForm';
import { useProduct } from '@/lib/hooks/useProducts';
import { Loader2 } from 'lucide-react';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const { data: product, isLoading, isError } = useProduct(id as string);

  const handleBack = () => {
    router.push('/admin/products/list');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={40} />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-8">
        <div>
          <h2 className="text-xl font-bold text-primary mb-2">Product Not Found</h2>
          <p className="text-muted mb-4">The product you are trying to edit does not exist or could not be loaded.</p>
          <button 
            onClick={handleBack}
            className="px-6 py-2 bg-brand text-white rounded-xl font-bold"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <ProductForm 
        product={product} 
        onBack={handleBack} 
      />
    </div>
  );
}
