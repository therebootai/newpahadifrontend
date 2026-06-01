import CategoryPage from "@/components/CategoryPage";
import {
  getCategoryBySlug,
  getRootCategories,
} from "@/lib/services/category";
import {
  getProducts,
  getProductsByCategorySlug,
} from "@/lib/services/product";

const Page = async ({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ search?: string }>;
}) => {
  const { slug } = await params;
  const { search } = await searchParams;

  // Special case for "All Jewellery"
  const isAll = slug === "all-jewellery";

  const [category, productData, categories] = await Promise.all([
    isAll
      ? Promise.resolve({
          name: search ? `Search Results for "${search}"` : "All Jewellery",
          slug: "all-jewellery",
        })
      : getCategoryBySlug(slug),
    isAll
      ? getProducts({ limit: 100, search }).then((products) => ({
          products,
          total: products.length,
        }))
      : getProductsByCategorySlug(slug, {
          limit: 20,
          search,
        }),
    getRootCategories(),
  ]);

  return (
    <div>
      <main className="main-shell">
        <CategoryPage
          products={productData?.products || []}
          total={productData?.total || 0}
          categoryName={
            category?.name || (isAll ? "All Jewellery" : "Category")
          }
          categorySlug={slug}
          categories={categories.map((item) => ({
            name: item.name,
            slug: item.slug,
            productCount: item.productCount,
            children: item.children?.map(child => ({
              name: child.name,
              slug: child.slug,
              productCount: child.productCount
            }))
          }))}
        />
      </main>
    </div>
  );
};

export default Page;
