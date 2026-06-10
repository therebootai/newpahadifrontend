import Image from "next/image";
import Link from "next/link";

import pahadiImage from "@/public/footer.jpeg";
import image1 from "@/public/1 copy.jpg";
import image2 from "@/public/2.jpg";

import mbl1 from "@/public/6.jpg";
import mbl2 from "@/public/7.jpg";
import mbl3 from "@/public/8.jpg";

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
        <Link href="/category/all-jewellery" className="group relative h-55 overflow-hidden rounded-3xl sm:h-95 lg:h-130 xl:h-150 block">
          <Image
            src={items[0].image}
            alt="Banner"
            fill
            className="hidden md:block object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <Image
            src={mbl1}
            alt="Banner Mobile"
            fill
            className="block md:hidden object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-black/10" />
        </Link>

        {/* RIGHT SIDE */}
        <div className="grid grid-rows-2 gap-4">
          
          {/* TOP IMAGE */}
          <Link href="/category/all-jewellery" className="group relative h-55 overflow-hidden rounded-3xl sm:h-75 lg:h-63 xl:h-73 block">
            <Image
              src={items[1].image}
              alt="Banner"
              fill
              className="hidden md:block object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <Image
              src={mbl3}
              alt="Banner Mobile"
              fill
              className="block md:hidden object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-black/10" />
          </Link>

          {/* BOTTOM IMAGE */}
          <Link href="/category/all-jewellery" className="group relative h-55 overflow-hidden rounded-3xl sm:h-75 lg:h-63 xl:h-73 block">
            <Image
              src={items[2].image}
              alt="Banner"
              fill
              className="hidden md:block object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <Image
              src={mbl2}
              alt="Banner Mobile"
              fill
              className="block md:hidden object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-black/10" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default StaticBanner;