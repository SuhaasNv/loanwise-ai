import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductCatalog } from "@/hooks/useProductCatalog";
import { getRecommendationMetrics, getRecommendationClicks } from "@/lib/api/analytics";
import { Gift, Star, PackageOpen, ExternalLink, MousePointerClick, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function RecommendationsPage() {
  const { data: catalog, isLoading: catalogLoading } = useProductCatalog();
  const { data: metrics } = useQuery({
    queryKey: ["recommendation-metrics"],
    queryFn: getRecommendationMetrics,
    staleTime: 30_000,
  });
  const { data: clicks } = useQuery({
    queryKey: ["recommendation-clicks"],
    queryFn: getRecommendationClicks,
    staleTime: 30_000,
  });

  const totalInterests = clicks?.reduce((sum, c) => sum + c.clicks, 0) ?? 0;
  const topProduct = clicks?.[0];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Product Recommendations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-generated next best offer suggestions for denied applicants
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">
              {metrics != null ? metrics.totalRecommendations : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Total Recommendations Generated</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/10">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">
              {metrics != null ? `${metrics.avgMatchScore}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Avg Match Score</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/10">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MousePointerClick className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{totalInterests > 0 ? totalInterests : "—"}</p>
            <p className="text-xs text-muted-foreground">Total Interests Expressed</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/10">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-center leading-tight text-sm font-medium truncate w-full px-2">
              {topProduct ? topProduct.productName.split(" ").slice(0, 2).join(" ") : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Top Expressed Interest</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion analytics */}
      {clicks && clicks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Interest by Product</h2>
          <Card>
            <CardContent className="pt-4 space-y-3">
              {clicks.map((c) => {
                const pct = totalInterests > 0 ? Math.round((c.clicks / totalInterests) * 100) : 0;
                return (
                  <div key={c.productName} className="flex items-center gap-3">
                    <p className="text-xs font-medium w-44 shrink-0 truncate">{c.productName}</p>
                    <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-12 text-right">{c.clicks} clicks</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Available Products</h2>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
            <Link to="/settings#catalog">
              <ExternalLink className="h-3 w-3" />
              Edit Catalog
            </Link>
          </Button>
        </div>
        {!catalogLoading && (catalog ?? []).length === 0 && (
          <EmptyState
            icon={PackageOpen}
            title="No products in catalog"
            description="No financial products have been configured yet."
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {catalogLoading
            ? Array.from({ length: 3 }).map((_, i) => (
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
            : (catalog ?? []).filter((rec) => (rec as {enabled?: boolean}).enabled !== false).map((rec) => {
                const interestCount = clicks?.find((c) => c.productName === rec.productName)?.clicks;
                return (
                  <Card key={rec.productName} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-medium flex-1">{rec.productName}</CardTitle>
                        <div className="flex items-center gap-1">
                          {rec.matchScore >= 85 && (
                            <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">Pre-qualified</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs shrink-0">{rec.matchScore}%</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Badge variant="outline" className="text-xs">{rec.type}</Badge>
                      <p className="text-2xl font-bold font-mono">{rec.rate}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                      {interestCount != null && interestCount > 0 && (
                        <p className="text-xs text-primary flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" />
                          {interestCount} interest{interestCount !== 1 ? "s" : ""} expressed
                        </p>
                      )}
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" asChild>
                        <Link to="/settings">
                          <ExternalLink className="h-3 w-3" />
                          Configure in Settings
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
        </div>
      </div>
    </div>
  );
}
