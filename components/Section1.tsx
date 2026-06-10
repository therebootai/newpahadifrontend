import Section1Client, { StorefrontCategory } from "./Section1Client";
import { getRootCategories } from "@/lib/services/category";

import fallbackImage from "@/public/all-jewellery.svg";

const Section1 = async () => {
  const categories = await getRootCategories();

  const storefrontCategories: StorefrontCategory[] = categories.length
    ? categories.map((category) => ({
        name: category.name,
        slug: category.slug,
        image: category.imageUrl || fallbackImage,
      }))
    : [
        {
          name: "All Jewellery",
          slug: "all-jewellery",
          image: fallbackImage,
        },
      ];

  return <Section1Client categories={storefrontCategories} />;
};

export default Section1;
