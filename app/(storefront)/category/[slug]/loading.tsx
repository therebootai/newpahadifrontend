import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="main-shell">
      <section className="w-full lg:h-[calc(100vh-120px)] lg:overflow-hidden flex flex-col pt-0">
        {/* Header Skeleton */}
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between shrink-0 px-1">
          <div>
            <Skeleton className="h-8 md:h-9 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Skeleton className="h-12 w-28 rounded-xl lg:hidden" /> {/* Mobile Filter Button */}
            <Skeleton className="h-12 w-48 rounded-xl" /> {/* Sort Button */}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start relative flex-1 min-h-0">
          {/* Sidebar Skeleton - Desktop only */}
          <aside className="hidden lg:block lg:sticky lg:top-0 left-0 top-0 z-60 h-full lg:h-full w-75 shrink-0 border-r border-gray-100 pr-6">
            <div className="space-y-8">
              <div>
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 rounded-md" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-2 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid Skeleton */}
          <div className="flex-1 w-full overflow-y-auto no-scrollbar pb-24 lg:px-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                  <div className="space-y-2 px-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex items-center gap-2 pt-1">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
