import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductCatalog } from "@/hooks/useProductCatalog";
import { useProductRecommendationStats } from "@/hooks/useLoans";
import { Gift, TrendingUp, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function RecommendationsPage() {
  const { data: catalog, isLoading: catalogLoading } = useProductCatalog();
  const { data: stats } = useProductRecommendationStats();

  const totalRecommendations = stats?.reduce((sum, s) => sum + s.count, 0) ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Product Recommendations</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-generated next best offer suggestions for applicants</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{totalRecommendations || "—"}</p>
            <p className="text-xs text-muted-foreground">Total Recommendations Generated</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/10">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <p className="text-2xl font-bold">34%</p>
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/10">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-warning" />
            </div>
            <p className="text-2xl font-bold">89%</p>
            <p className="text-xs text-muted-foreground">Avg Match Score</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Available Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {catalogLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-36" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (catalog ?? []).map((rec) => (
            <Card key={rec.productName} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{rec.productName}</CardTitle>
                  <Badge variant="secondary" className="text-xs">{rec.matchScore}%</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="outline" className="text-xs">{rec.type}</Badge>
                <p className="text-2xl font-bold font-mono">{rec.rate}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                <Button variant="outline" size="sm" className="w-full text-xs">Configure Offer</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
