"use client";

import Image from "next/image";
import Link from "next/link";
import type { StaticImageData } from "next/image";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

export type StorefrontCategory = {
  name: string;
  slug: string;
  image: string | StaticImageData;
};

type Section1ClientProps = {
  categories: StorefrontCategory[];
};

const Section1Client = ({ categories }: Section1ClientProps) => {
  return (
    <section className="w-full py-5">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 md:text-3xl">
          Shop By Category
        </h2>

        <p className="mt-2 text-gray-500">Explore our latest collections</p>
      </div>

      <Swiper
        modules={[Autoplay]}
        spaceBetween={16}
        centeredSlides={false}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        speed={800}
        loop={categories.length > 5}
        breakpoints={{
          0: {
            slidesPerView: 3.2,
          },
          640: {
            slidesPerView: 4.2,
          },
          768: {
            slidesPerView: 5.2,
          },
          1024: {
            slidesPerView: 6.2,
          },
          1280: {
            slidesPerView: 7.2,
          },
          1536: {
            slidesPerView: 8.2,
          },
        }}
        className="w-full"
      >

        {categories.map((item) => (
          <SwiperSlide key={item.slug}>
            <Link
              href={`/category/${item.slug}`}
              className="group flex flex-col items-center"
            >
              <Image
                src={item.image}
                alt={item.name}
                width={140}
                height={140}
                className="h-24 mt-5 w-24 rounded-md object-cover transition-all duration-300 group-hover:scale-105 md:h-32 md:w-32 lg:h-35 lg:w-35"
              />

              <p className="mt-2 text-center text-xs font-medium text-gray-700 transition-all duration-300 group-hover:text-amber-500 md:text-sm">
                {item.name}
              </p>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default Section1Client;
