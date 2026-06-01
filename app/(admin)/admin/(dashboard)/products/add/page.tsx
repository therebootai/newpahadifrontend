'use client';

import { useRouter } from 'next/navigation';
import ProductForm from '../components/ProductForm';

export default function AddProductPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/admin/products/list');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <ProductForm 
        product={null} 
        onBack={handleBack} 
      />
    </div>
  );
}
