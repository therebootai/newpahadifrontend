import Image from "next/image";
import Link from "next/link";

import pahadiImage from "@/public/footer.jpeg";
import image1 from "../public/1 copy.jpg";
import image2 from "@/public/2.jpg";

const items = [
  {
    image: pahadiImage,
  },
  {
    image: image1,
  },
  {
    image: image2,
  },
];

const StaticBanner = () => {
  return (
    <section className="w-full py-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        
        {/* LEFT IMAGE */}
        <Link href="/category/all-jewellery" className="group relative h-[280px] overflow-hidden rounded-3xl sm:h-[380px] lg:h-[520px] xl:h-[600px] block">
          <Image
            src={items[0].image}
            alt="Banner"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-black/10" />
        </Link>

        {/* RIGHT SIDE */}
        <div className="grid grid-rows-2 gap-4">
          
          {/* TOP IMAGE */}
          <Link href="/category/all-jewellery" className="group relative h-70 overflow-hidden rounded-3xl sm:h-75 lg:h-63 xl:h-73 block">
            <Image
              src={items[1].image}
              alt="Banner"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-black/10" />
          </Link>

          {/* BOTTOM IMAGE */}
          <Link href="/category/all-jewellery" className="group relative h-70 overflow-hidden rounded-3xl sm:h-75 lg:h-63 xl:h-73 block">
            <Image
              src={items[2].image}
              alt="Banner"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-black/10" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default StaticBanner;