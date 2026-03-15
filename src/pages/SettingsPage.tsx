import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";

export default function SettingsPage() {
  const { settings, saveSettings, resetSettings } = useSettings();

  function handleSave(section: string) {
    toast.success(`${section} saved`);
  }

  return (
    <div className="p-6 space-y-6 max-w-[900px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure platform behavior and thresholds</p>
      </motion.div>

      <Tabs defaultValue="model" className="space-y-4">
        <TabsList className="h-9">
          <TabsTrigger value="model" className="text-xs">LLM Configuration</TabsTrigger>
          <TabsTrigger value="risk" className="text-xs">Risk Thresholds</TabsTrigger>
          <TabsTrigger value="bias" className="text-xs">Bias Detection</TabsTrigger>
          <TabsTrigger value="email" className="text-xs">Email Templates</TabsTrigger>
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
                  onValueChange={(v) => saveSettings({ modelProvider: v })}
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
                  onChange={(e) => saveSettings({ apiEndpoint: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Temperature</Label>
                  <span className="text-xs font-mono text-muted-foreground">{settings.temperature.toFixed(1)}</span>
                </div>
                <Slider
                  value={[settings.temperature]}
                  onValueChange={([v]) => saveSettings({ temperature: v })}
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
                  onCheckedChange={(v) => saveSettings({ streamingEnabled: v })}
                />
              </div>
              <Separator />
              <Button size="sm" className="text-xs" onClick={() => handleSave("LLM configuration")}>Save Configuration</Button>
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
                  onValueChange={([v]) => saveSettings({ riskThreshold: v })}
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
                  onChange={(e) => saveSettings({ minCreditScore: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Max Debt-to-Income Ratio</Label>
                <Input
                  className="h-9 text-sm font-mono"
                  type="number"
                  step="0.01"
                  value={settings.maxDti}
                  onChange={(e) => saveSettings({ maxDti: Number(e.target.value) })}
                />
              </div>
              <Separator />
              <Button size="sm" className="text-xs" onClick={() => handleSave("Risk thresholds")}>Save Thresholds</Button>
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
                  onValueChange={([v]) => saveSettings({ biasThreshold: v })}
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
                  onCheckedChange={(v) => saveSettings({ autoRegenerate: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Protected Category Screening</Label>
                  <p className="text-[10px] text-muted-foreground">Screen for references to protected categories</p>
                </div>
                <Switch
                  checked={settings.protectedCategoryScreening}
                  onCheckedChange={(v) => saveSettings({ protectedCategoryScreening: v })}
                />
              </div>
              <Separator />
              <Button size="sm" className="text-xs" onClick={() => handleSave("Bias detection settings")}>Save Settings</Button>
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
                  onChange={(e) => saveSettings({ approvalPrompt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Denial Template Prompt</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border bg-secondary/30 p-3 text-sm"
                  value={settings.denialPrompt}
                  onChange={(e) => saveSettings({ denialPrompt: e.target.value })}
                />
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button size="sm" className="text-xs" onClick={() => handleSave("Email templates")}>Save Templates</Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => { resetSettings(); toast.info("Settings reset to defaults"); }}>
                  Reset Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
