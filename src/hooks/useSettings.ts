import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, saveSettings } from "@/lib/api/settings";

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

function isEqual(a: PlatformSettings, b: PlatformSettings): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useSettings() {
  const qc = useQueryClient();

  // Committed (saved) settings — merged from remote + local storage
  const [committedSettings, setCommittedSettings] = useState<PlatformSettings>(loadLocal);

  // Draft changes — local edits not yet committed to backend
  const [draftSettings, setDraftSettings] = useState<PlatformSettings>(loadLocal);

  // Fetch from backend; merge over defaults
  const { data: remoteSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    staleTime: 60_000,
    retry: 1,
  });

  const mergedCommitted: PlatformSettings = {
    ...DEFAULTS,
    ...committedSettings,
    ...(remoteSettings as Partial<PlatformSettings> | undefined),
  };

  // Draft is local state; merged committed is the baseline
  const settings: PlatformSettings = draftSettings;

  const hasUnsavedChanges = !isEqual(draftSettings, mergedCommitted);

  const { mutate: mutateSave, isPending: isSaving } = useMutation({
    mutationFn: (partial: Partial<PlatformSettings>) =>
      saveSettings(partial as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  /**
   * Update local draft state only — does NOT auto-save to backend.
   * Call commitSettings() to persist.
   */
  const updateSettings = useCallback(
    (partial: Partial<PlatformSettings>) => {
      setDraftSettings((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  /**
   * Persist the current draft to localStorage and backend.
   */
  const commitSettings = useCallback(
    (sectionOverride?: Partial<PlatformSettings>) => {
      const toSave = sectionOverride ? { ...draftSettings, ...sectionOverride } : draftSettings;
      setCommittedSettings(toSave);
      setDraftSettings(toSave);
      saveLocal(toSave);
      mutateSave(toSave);
    },
    [draftSettings, mutateSave]
  );

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCommittedSettings(DEFAULTS);
    setDraftSettings(DEFAULTS);
    mutateSave(DEFAULTS);
  }, [mutateSave]);

  return {
    settings,
    /** Update draft without saving */
    updateSettings,
    /** Commit draft to backend */
    commitSettings,
    resetSettings,
    hasUnsavedChanges,
    isSaving,
    /** Legacy alias kept for backward compatibility — same as updateSettings */
    saveSettings: updateSettings,
  };
}
