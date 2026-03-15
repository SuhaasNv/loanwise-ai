import { useState, useCallback } from "react";

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

const DEFAULTS: PlatformSettings = {
  modelProvider: "gemini",
  apiEndpoint: "https://generativelanguage.googleapis.com/v1beta",
  temperature: 0.7,
  streamingEnabled: true,
  riskThreshold: 60,
  minCreditScore: 620,
  maxDti: 0.43,
  biasThreshold: 15,
  autoRegenerate: true,
  protectedCategoryScreening: true,
  approvalPrompt:
    "Generate a professional, warm approval email for a loan applicant. Include loan details, next steps, and contact information.",
  denialPrompt:
    "Generate a respectful denial email. Explain the decision without disclosing specific model details. Suggest alternative products and provide appeal process information.",
};

function loadSettings(): PlatformSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<PlatformSettings>(loadSettings);

  const saveSettings = useCallback((partial: Partial<PlatformSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors (private mode, quota exceeded)
      }
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettingsState(DEFAULTS);
  }, []);

  return { settings, saveSettings, resetSettings };
}
