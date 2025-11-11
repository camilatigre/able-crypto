import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp } from 'lucide-react';

interface EmptyStateProps {
  pair: string;
}

export const EmptyState = ({ pair }: EmptyStateProps) => {
  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-serif font-semibold">
          <span className="text-foreground">{pair}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground font-sans text-sm">Waiting for data...</p>
      </CardContent>
    </Card>
  );
};

