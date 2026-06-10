import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HeroSlider from "@/components/HeroSlider";
import ProductSection from "@/components/ProductSection";
import Section1 from "@/components/Section1";
import VideoSlider from "@/components/VideoSlider";
import StaticBanner from "@/components/StaticBanner";
import WelcomePopup from "@/components/WelcomePopup";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export const revalidate = 60; // Revalidate every 60 seconds

function page() {
  return (
    <div>
      <WelcomePopup />
      <div className="main-shell px-0! sm:px-5! lg:px-12! pt-3! pb-1!">
        <HeroSlider />
      </div>
      <main className="main-shell">
        <Suspense
          fallback={
            <div className="h-32 w-full animate-pulse bg-gray-50 rounded-xl mb-8" />
          }
        >
          <Section1 />
        </Suspense>

        <Suspense
          fallback={
            <div className="space-y-10 py-10">
              <Skeleton className="h-10 w-64 bg-gray-100" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {[...Array(5)].map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-80 w-full bg-gray-50 rounded-2xl"
                  />
                ))}
              </div>
            </div>
          }
        >
          <ProductSection />
        </Suspense>

        <Suspense
          fallback={
            <Skeleton className="h-96 w-full bg-gray-50 rounded-3xl my-12" />
          }
        >
          <VideoSlider />
        </Suspense>

        <StaticBanner />
      </main>
    </div>
  );
}

export default page;
