"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import { useStorefrontData } from "@/lib/hooks/useStorefront";
import Link from "next/link";
import { Skeleton } from "./ui/Skeleton";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

const HeroSlider = () => {
  const { data, isLoading } = useStorefrontData();
  const banners = data?.banners || [];

  if (isLoading) {
    return (
      <div className="w-full pb-1">
        <Skeleton className="h-87.5 md:h-130 w-full rounded-3xl" />
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <div className="w-full pb-1">
      <Swiper
        effect="fade"
        modules={[Autoplay, Pagination, EffectFade]}
        slidesPerView={1}
        preventClicks={false}
        preventClicksPropagation={false}
        loop={banners.length > 1}
        speed={1400}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        className="hero-slider"
      >
        {banners.map((slide, index) => (
          <SwiperSlide key={slide._id}>
            <div className="relative h-87.5 md:h-130 w-full overflow-hidden rounded-3xl">
              <Link
                href={slide.link || "/category/all-jewellery"}
                className="relative block w-full h-full"
              >
                <Image
                  src={slide.desktopImage.url}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className="hidden md:block object-cover"
                  sizes="100vw"
                />

                <Image
                  src={slide.mobileImage.url}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className="block md:hidden object-cover"
                  sizes="100vw"
                />

                <div className="absolute inset-0 bg-black/30 pointer-events-none" />
              </Link>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HeroSlider;
