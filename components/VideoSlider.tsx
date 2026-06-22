"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useStorefrontData } from "@/lib/hooks/useStorefront";
import { Skeleton } from "./ui/Skeleton";

import "swiper/css";

import { useEffect, useState } from "react";

const VideoSlider = () => {
  const { data, isLoading } = useStorefrontData();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const videos = data?.videos || [];

  if (!isMounted || isLoading) {
    return (
      <section className="w-full py-12">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-115 w-full md:h-115 md:w-64 rounded-2xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (videos.length === 0) return null;

  return (
    <section className="w-full py-12">
      {/* HEADING */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 md:text-3xl">
          Trending Videos
        </h2>

        <p className="mt-2 text-gray-500">
          Watch our latest jewellery collections
        </p>
      </div>

      {/* SLIDER */}
      <Swiper
        modules={[Autoplay]}
        spaceBetween={12}
        grabCursor={true}
        slidesPerView={1}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        loop={videos.length > 3}
        breakpoints={{
          640: {
            slidesPerView: 2,
          },
          768: {
            slidesPerView: 3,
          },
          1024: {
            slidesPerView: 4,
          },
          1280: {
            slidesPerView: 5,
          },
        }}
        className="w-full"
      >
        {videos.map((video) => (
          <SwiperSlide key={video._id}>
            <div className="overflow-hidden rounded-2xl bg-black shadow-sm">
              <video
                autoPlay
                muted
                loop
                playsInline
                controls={false}
                draggable={false}
                preload="metadata"
                className="pointer-events-none h-115 w-full object-cover md:h-115"
              >
                <source
                  src={video.video.url}
                  type="video/mp4"
                />
              </video>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default VideoSlider;
