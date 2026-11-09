import { Skeleton } from "@/components/ui/skeleton";

export function GridSkeleton({ header, count = 8 }: { header?: boolean; count?: number }) {
  return (
    <div className="flex flex-col gap-8">
      {header && (
        <div className="flex flex-col gap-3 border-b border-border pb-8">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-14 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5]" />
        ))}
      </div>
    </div>
  );
}
