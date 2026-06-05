import ProductCard from "./ProductCard";
import { getHomeData, getProducts, Product } from "@/lib/services/product";
import image1 from "../public/3.jpg";
import image2 from "../public/4.jpg";
import image3 from "../public/image 3.jpg.jpeg";
import Image from "next/image";
import Link from "next/link";

type HomeSection = {
  title?: string;
  name?: string;
  products: Product[];
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

const renderProductCard = (product: Product) => (
  <ProductCard
    key={product.id}
    image={product.image}
    title={product.title}
    price={formatPrice(product.price)}
    oldPrice={
      product.mrp > product.price ? formatPrice(product.mrp) : undefined
    }
    discount={product.discount ? `${product.discount}% OFF` : undefined}
    href={`/product/${product.slug}`}
    categoryName={product.categoryName}
    product={product}
    variantId={product.variantId || product.id}
  />
);

const ProductSection = async () => {
  const { latestProducts, activeSections } = await getHomeData();

  return (
    <div className="w-full py-10 space-y-16">
      {/* Latest Collections Section */}
      {latestProducts.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold">Latest Collections</p>
              <div className="h-1 w-20 bg-brand mt-2 rounded-full" />
            </div>
            <Link 
              href="/category/all-jewellery"
              className="text-brand font-bold text-sm hover:underline mb-2"
            >
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {latestProducts.slice(0, 5).map(renderProductCard)}
          </div>
        </div>
      )}

      <Link href="/category/all-jewellery">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-5">
          <Image
            src={image1}
            alt=""
            width={500}
            height={500}
            className="h-full w-full rounded-lg object-cover"
          />

          <Image
            src={image2}
            alt=""
            width={500}
            height={500}
            className="h-full w-full rounded-lg object-cover"
          />

          <Image
            src={image3}
            alt=""
            width={500}
            height={500}
            className="h-full w-full rounded-lg object-cover sm:col-span-2 lg:col-span-1"
          />
        </div>
      </Link>

      {/* Category Specific Sections */}
      {activeSections.length > 0 ? (
        activeSections.map((section: any) => (
          <div key={section.id} className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold">{section.name}</p>
                <div className="h-1 w-20 bg-brand mt-2 rounded-full" />
              </div>
              <Link 
                href={`/category/${section.slug}`}
                className="text-brand font-bold text-sm hover:underline mb-2"
              >
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {section.products.map(renderProductCard)}
            </div>
          </div>
        ))
      ) : (
        !latestProducts.length && (
          <div className="text-center py-20 text-muted">
            No featured collections available.
          </div>
        )
      )}

    </div>
  );
};

export default ProductSection;
