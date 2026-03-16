import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, AlertCircle, Plus, Trash2, GripVertical, PackageOpen } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductCatalog, saveProductCatalog } from "@/lib/api/settings";
import type { ProductCatalogItem } from "@/types/loan";

// ─── Product Catalog Tab ──────────────────────────────────────────────────────

const PRODUCT_TYPES = ["Personal Loan", "FHA Mortgage", "Credit Card", "Savings Plan", "Auto Loan", "HELOC", "Reduced Amount Loan", "Other"];

function ProductCatalogTab() {
  const qc = useQueryClient();
  const { data: catalog, isLoading } = useQuery({
    queryKey: ["product-catalog-settings"],
    queryFn: getProductCatalog,
  });

  const [draft, setDraft] = useState<ProductCatalogItem[] | null>(null);
  const items: ProductCatalogItem[] = draft ?? catalog ?? [];

  const saveMutation = useMutation({
    mutationFn: saveProductCatalog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-catalog"] });
      qc.invalidateQueries({ queryKey: ["product-catalog-settings"] });
      setDraft(null);
      toast.success("Product catalog saved");
    },
    onError: () => toast.error("Failed to save catalog"),
  });

  function updateItem(idx: number, patch: Partial<ProductCatalogItem>) {
    const next = items.map((item, i) => (i === idx ? { ...item, ...patch } : item));
    setDraft(next);
  }

  function removeItem(idx: number) {
    setDraft(items.filter((_, i) => i !== idx));
  }

  function addItem() {
    setDraft([
      ...items,
      { productName: "", type: "Personal Loan", rate: "", description: "", matchScore: 75, enabled: true },
    ]);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Product Catalog</CardTitle>
        <CardDescription className="text-xs">
          Configure the financial products recommended to denied applicants. Enabled products are used by the AI pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <PackageOpen className="h-8 w-8 opacity-40" />
            <p className="text-xs">No products configured. Add one below.</p>
          </div>
        )}
        {items.map((item, idx) => (
          <div key={idx} className="border rounded-lg p-3 space-y-3 bg-secondary/20">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Product Name</Label>
                  <Input
                    className="h-8 text-xs"
                    value={item.productName}
                    onChange={(e) => updateItem(idx, { productName: e.target.value })}
                    placeholder="e.g. SecureLine Personal Loan"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Type</Label>
                  <Select value={item.type} onValueChange={(v) => updateItem(idx, { type: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Rate</Label>
                  <Input
                    className="h-8 text-xs"
                    value={item.rate}
                    onChange={(e) => updateItem(idx, { rate: e.target.value })}
                    placeholder="e.g. 7.5% APR"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Default Match Score</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[item.matchScore]}
                      onValueChange={([v]) => updateItem(idx, { matchScore: v })}
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono w-8 text-right">{item.matchScore}</span>
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Description</Label>
                  <Input
                    className="h-8 text-xs"
                    value={item.description}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                    placeholder="Short description shown to applicants"
                  />
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 shrink-0">
                <Switch
                  checked={item.enabled}
                  onCheckedChange={(v) => updateItem(idx, { enabled: v })}
                />
                <span className="text-[9px] text-muted-foreground">{item.enabled ? "On" : "Off"}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removeItem(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {item.matchScore >= 85 && (
              <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
                Pre-qualified threshold (≥85%)
              </Badge>
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={addItem}>
            <Plus className="h-3.5 w-3.5" />
            Add Product
          </Button>
          <Button
            size="sm"
            className="text-xs gap-1.5"
            disabled={saveMutation.isPending || draft === null}
            onClick={() => saveMutation.mutate(items)}
          >
            {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Catalog
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings, commitSettings, resetSettings, hasUnsavedChanges, isSaving } = useSettings();

  function handleSave(section: string) {
    commitSettings();
    toast.success(`${section} saved`);
  }

  return (
    <div className="p-6 space-y-6 max-w-[900px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure platform behavior and thresholds</p>
          </div>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Unsaved changes
            </div>
          )}
        </div>
      </motion.div>

      <Tabs defaultValue="model" className="space-y-4">
        <TabsList className="h-9 flex-wrap">
          <TabsTrigger value="model" className="text-xs">LLM Configuration</TabsTrigger>
          <TabsTrigger value="risk" className="text-xs">Risk Thresholds</TabsTrigger>
          <TabsTrigger value="bias" className="text-xs">Bias Detection</TabsTrigger>
          <TabsTrigger value="email" className="text-xs">Email Templates</TabsTrigger>
          <TabsTrigger value="catalog" className="text-xs">Product Catalog</TabsTrigger>
        </TabsList>

        {/* ── LLM ────────────────────────────────────────────────────────── */}
        <TabsContent value="model">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">LLM Configuration</CardTitle>
              <CardDescription className="text-xs">Configure the language model used for email generation and analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Model Provider</Label>
                <Select
                  value={settings.modelProvider}
                  onValueChange={(v) => updateSettings({ modelProvider: v })}
                >
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Google Gemini 2.5 Flash</SelectItem>
                    <SelectItem value="openai">OpenAI GPT-4o</SelectItem>
                    <SelectItem value="anthropic">Anthropic Claude 3.5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">API Endpoint</Label>
                <Input
                  className="h-9 text-sm"
                  value={settings.apiEndpoint}
                  onChange={(e) => updateSettings({ apiEndpoint: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Temperature</Label>
                  <span className="text-xs font-mono text-muted-foreground">{settings.temperature.toFixed(1)}</span>
                </div>
                <Slider
                  value={[settings.temperature]}
                  onValueChange={([v]) => updateSettings({ temperature: v })}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-[10px] text-muted-foreground">Controls randomness. Lower = more focused, higher = more creative</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Streaming Responses</Label>
                  <p className="text-[10px] text-muted-foreground">Enable real-time streaming for email generation</p>
                </div>
                <Switch
                  checked={settings.streamingEnabled}
                  onCheckedChange={(v) => updateSettings({ streamingEnabled: v })}
                />
              </div>
              <Separator />
              <Button size="sm" className="text-xs gap-1.5" onClick={() => handleSave("LLM configuration")} disabled={isSaving}>
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Risk ───────────────────────────────────────────────────────── */}
        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Risk Thresholds</CardTitle>
              <CardDescription className="text-xs">Configure automatic decision boundaries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Auto-Approve Below</Label>
                  <span className="text-sm font-mono font-medium">{settings.riskThreshold}%</span>
                </div>
                <Slider
                  value={[settings.riskThreshold]}
                  onValueChange={([v]) => updateSettings({ riskThreshold: v })}
                  max={100}
                  step={5}
                />
                <p className="text-[10px] text-muted-foreground">Applications with risk score below this threshold will be auto-approved</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Minimum Credit Score</Label>
                <Input
                  className="h-9 text-sm font-mono"
                  type="number"
                  value={settings.minCreditScore}
                  onChange={(e) => updateSettings({ minCreditScore: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Max Debt-to-Income Ratio</Label>
                <Input
                  className="h-9 text-sm font-mono"
                  type="number"
                  step="0.01"
                  value={settings.maxDti}
                  onChange={(e) => updateSettings({ maxDti: Number(e.target.value) })}
                />
              </div>
              <Separator />
              <Button size="sm" className="text-xs gap-1.5" onClick={() => handleSave("Risk thresholds")} disabled={isSaving}>
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Thresholds
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Bias ───────────────────────────────────────────────────────── */}
        <TabsContent value="bias">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Bias Detection</CardTitle>
              <CardDescription className="text-xs">Configure bias and toxicity detection thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Bias Score Threshold</Label>
                  <span className="text-sm font-mono font-medium">{settings.biasThreshold}%</span>
                </div>
                <Slider
                  value={[settings.biasThreshold]}
                  onValueChange={([v]) => updateSettings({ biasThreshold: v })}
                  max={50}
                  step={1}
                />
                <p className="text-[10px] text-muted-foreground">Emails exceeding this bias score will be flagged for review</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Auto-Regenerate on Failure</Label>
                  <p className="text-[10px] text-muted-foreground">Automatically regenerate emails that fail bias checks</p>
                </div>
                <Switch
                  checked={settings.autoRegenerate}
                  onCheckedChange={(v) => updateSettings({ autoRegenerate: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Protected Category Screening</Label>
                  <p className="text-[10px] text-muted-foreground">Screen for references to protected categories</p>
                </div>
                <Switch
                  checked={settings.protectedCategoryScreening}
                  onCheckedChange={(v) => updateSettings({ protectedCategoryScreening: v })}
                />
              </div>
              <Separator />
              <Button size="sm" className="text-xs gap-1.5" onClick={() => handleSave("Bias detection settings")} disabled={isSaving}>
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Email Templates ─────────────────────────────────────────────── */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Email Templates</CardTitle>
              <CardDescription className="text-xs">Customize email template prompts for different decisions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Approval Template Prompt</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border bg-secondary/30 p-3 text-sm"
                  value={settings.approvalPrompt}
                  onChange={(e) => updateSettings({ approvalPrompt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Denial Template Prompt</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border bg-secondary/30 p-3 text-sm"
                  value={settings.denialPrompt}
                  onChange={(e) => updateSettings({ denialPrompt: e.target.value })}
                />
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button size="sm" className="text-xs gap-1.5" onClick={() => handleSave("Email templates")} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Templates
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => { resetSettings(); toast.info("Settings reset to defaults"); }}>
                  Reset Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Product Catalog ──────────────────────────────────────────────── */}
        <TabsContent value="catalog">
          <ProductCatalogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
