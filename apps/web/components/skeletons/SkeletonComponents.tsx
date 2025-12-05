import { Skeleton } from "@/components/ui/skeleton";

export function CountrySkeleton() {
  return (
    <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-5 h-[88px] flex items-center justify-between">
      <div className="flex items-center gap-4">
         <Skeleton className="h-10 w-10 rounded-full bg-[var(--voyage-border)]" />
         <Skeleton className="h-5 w-32 bg-[var(--voyage-border)]" />
      </div>
    </div>
  );
}

export function PlanCardSkeleton() {
  return (
    <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 h-[220px] flex flex-col justify-between">
        <div className="space-y-3">
           <div className="flex justify-between">
             <Skeleton className="h-6 w-20 bg-[var(--voyage-border)]" />
             <Skeleton className="h-6 w-6 rounded-full bg-[var(--voyage-border)]" />
           </div>
           <Skeleton className="h-8 w-32 bg-[var(--voyage-border)]" />
           <Skeleton className="h-4 w-48 bg-[var(--voyage-border)]" />
        </div>
        <div className="flex justify-between items-end pt-4 border-t border-[var(--voyage-border)]">
           <Skeleton className="h-8 w-24 bg-[var(--voyage-border)]" />
           <Skeleton className="h-8 w-20 bg-[var(--voyage-border)]" />
        </div>
    </div>
  );
}

export function PlanDetailsSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
       <div className="space-y-6">
          <Skeleton className="h-12 w-3/4 bg-[var(--voyage-border)]" />
          <Skeleton className="h-6 w-1/2 bg-[var(--voyage-border)]" />
          <Skeleton className="h-64 w-full rounded-xl bg-[var(--voyage-border)]" />
       </div>
       <div className="h-96 rounded-xl bg-[var(--voyage-border)]" />
    </div>
  );
}

