import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, saveSettings } from "@/lib/api/analytics";

const STORAGE_KEY = "loanwise:settings";

export interface PlatformSettings {
  // LLM
  modelProvider: string;
  apiEndpoint: string;
  temperature: number;
  streamingEnabled: boolean;
  // Risk
  riskThreshold: number;
  minCreditScore: number;
  maxDti: number;
  // Bias
  biasThreshold: number;
  autoRegenerate: boolean;
  protectedCategoryScreening: boolean;
  // Email templates
  approvalPrompt: string;
  denialPrompt: string;
}

export const DEFAULTS: PlatformSettings = {
  modelProvider: "gemini",
  apiEndpoint: "https://generativelanguage.googleapis.com/v1beta",
  temperature: 0.2,
  streamingEnabled: true,
  riskThreshold: 50,
  minCreditScore: 620,
  maxDti: 0.43,
  biasThreshold: 10,
  autoRegenerate: true,
  protectedCategoryScreening: true,
  approvalPrompt:
    "Generate a professional, warm approval email for a loan applicant. Include loan details, next steps, and contact information.",
  denialPrompt:
    "Generate a respectful denial email. Explain the decision without disclosing specific model details. Suggest alternative products and provide appeal process information.",
};

function loadLocal(): PlatformSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function saveLocal(settings: PlatformSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota / private mode errors
  }
}

export function useSettings() {
  const qc = useQueryClient();
  const [localSettings, setLocalSettings] = useState<PlatformSettings>(loadLocal);

  // Fetch from backend; merge over defaults
  const { data: remoteSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    staleTime: 60_000,
    retry: 1,
  });

  const settings: PlatformSettings = {
    ...DEFAULTS,
    ...localSettings,
    ...(remoteSettings as Partial<PlatformSettings> | undefined),
  };

  const { mutate: mutateSave } = useMutation({
    mutationFn: (partial: Partial<PlatformSettings>) =>
      saveSettings(partial as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  const saveSettings_ = useCallback(
    (partial: Partial<PlatformSettings>) => {
      const next = { ...settings, ...partial };
      setLocalSettings(next);
      saveLocal(next);
      mutateSave(partial);
    },
    [settings, mutateSave]
  );

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLocalSettings(DEFAULTS);
    mutateSave(DEFAULTS);
  }, [mutateSave]);

  return { settings, saveSettings: saveSettings_, resetSettings };
}
