import HeaderClient from "./HeaderClient";
import { getRootCategories } from "@/lib/services/category";

const Header = async () => {
  const categories = await getRootCategories();

  return (
    <HeaderClient
      categories={categories.map((category) => ({
        name: category.name,
        slug: category.slug,
        imageUrl: category.imageUrl,
        iconUrl: category.iconUrl,
      }))}
    />
  );
};

export default Header;
