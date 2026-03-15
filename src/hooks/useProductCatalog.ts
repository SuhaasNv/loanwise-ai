import { useQuery } from "@tanstack/react-query";
import { getProductCatalog } from "@/lib/api/agents";

export function useProductCatalog() {
  return useQuery({
    queryKey: ["product-catalog"],
    queryFn: getProductCatalog,
    staleTime: 10 * 60 * 1000,
  });
}
