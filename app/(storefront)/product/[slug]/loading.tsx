import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="main-shell pb-24">
      {/* Breadcrumb Skeleton */}
      <div className="mb-4">
        <div className="flex items-center gap-2 py-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 relative items-start">
        {/* Left Column - Images */}
        <div className="w-full lg:w-[45%] flex flex-col gap-4 lg:sticky lg:top-24">
          <Skeleton className="aspect-[4/5] w-full rounded-2xl md:rounded-3xl" />
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-20 md:w-24 aspect-square rounded-xl md:rounded-2xl shrink-0" />
            ))}
          </div>
        </div>

        {/* Right Column - Product Details */}
        <div className="w-full lg:w-[55%] flex flex-col">
          <div className="mb-8">
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-8 md:h-10 w-11/12 mb-4" />
            
            <div className="flex items-center gap-6 mb-6">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-4" />
                ))}
              </div>
              <Skeleton className="h-4 w-24" />
            </div>

            <div className="flex items-end gap-4 mb-6 pb-8 border-b border-gray-100">
              <Skeleton className="h-10 md:h-12 w-36" />
              <Skeleton className="h-6 w-24 mb-1" />
              <Skeleton className="h-7 w-20 mb-1 rounded-full" />
            </div>
          </div>

          <div className="space-y-8">
            {/* Options / Variants */}
            <div>
              <Skeleton className="h-5 w-28 mb-4" />
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-24 rounded-2xl" />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-14 flex-1 rounded-full" />
              <Skeleton className="h-14 flex-1 rounded-full" />
            </div>

            {/* Pincode & Delivery Box */}
            <div className="p-6 border border-gray-100 rounded-3xl space-y-5 bg-gray-50/30">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-12 flex-1 rounded-2xl" />
                <Skeleton className="h-12 w-28 rounded-2xl" />
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>

            {/* Description & Accordions */}
            <div className="space-y-4 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border-b border-gray-100 pb-4">
                  <div className="flex justify-between items-center py-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  {i === 0 && (
                    <div className="space-y-2 mt-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
