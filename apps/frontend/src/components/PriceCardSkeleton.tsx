import { Card, CardContent, CardHeader } from './ui/card';
import { Skeleton } from './ui/skeleton';

export const PriceCardSkeleton = () => {
  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-baseline border-b border-border pb-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex justify-between items-baseline">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-3 w-40" />
        </div>

        <Skeleton className="h-40 w-full" />
      </CardContent>
    </Card>
  );
};

