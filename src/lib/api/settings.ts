import { apiClient } from "@/lib/api-client";
import type { ProductCatalogItem } from "@/types/loan";

export function getSettings() {
  return apiClient<Record<string, unknown>>("/settings");
}

export function saveSettings(settings: Record<string, unknown>) {
  return apiClient<Record<string, unknown>>("/settings", {
    method: "PUT",
    body: JSON.stringify({ settings }),
  });
}

export function getProductCatalog() {
  return apiClient<ProductCatalogItem[]>("/settings/product-catalog");
}

export function saveProductCatalog(catalog: ProductCatalogItem[]) {
  return apiClient<{ success: boolean }>("/settings/product-catalog", {
    method: "PUT",
    body: JSON.stringify(catalog),
  });
}
