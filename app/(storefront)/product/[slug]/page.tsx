import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductPage from "@/components/ProductPage";
import { getProductBySlug, getVariantBySlug, getSimilarProducts, getVariantsByProduct } from "@/lib/services/product";

const page = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const [product, variant] = await Promise.all([
    getProductBySlug(slug),
    getVariantBySlug(slug),
  ]);

  let variantData = variant;
  if (!variantData && product) {
    const variants = await getVariantsByProduct(product.id);
    if (variants.length > 0) {
      const defaultV = variants.find(v => v.isDefault) || variants[0];
      variantData = {
        currentVariant: defaultV,
        siblingOptions: variants as any,
      };
    }
  }

  const productId = variantData?.currentVariant?.productId?._id || product?.id;
  const similarProducts = productId ? await getSimilarProducts(productId) : [];

  return (
    <div>
      <main className="main-shell">
        <ProductPage product={product} variant={variantData} similarProducts={similarProducts} />
      </main>
    </div>
  );
};

export default page;
