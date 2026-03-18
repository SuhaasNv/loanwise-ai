import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  DollarSign,
  CreditCard,
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Pencil,
  ShieldCheck,
  AlertTriangle,
  Save,
} from "lucide-react";

const DRAFT_STORAGE_KEY = "loanwise:loan-form-draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCreateLoan } from "@/hooks/useCreateLoan";
import { motion, AnimatePresence } from "framer-motion";

// ─── NRIC/FIN validation (Singapore) ──────────────────────────────────────────
// Format: S/T/F/G/M followed by 7 digits and a letter (case-insensitive)

function validateNric(value: string): boolean {
  if (!value) return true; // optional field
  return /^[STFGM]\d{7}[A-Z]$/i.test(value.trim());
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  applicantName: z.string().min(2, "Full name is required"),
  applicantEmail: z.string().email("Valid email required"),
  nric: z
    .string()
    .optional()
    .refine((v) => !v || validateNric(v), {
      message: "Enter a valid Singapore NRIC/FIN (e.g. S1234567D)",
    }),
  income: z.coerce.number().min(1000, "Annual income must be at least $1,000"),
  creditScore: z.coerce
    .number()
    .min(300, "Credit score must be 300–850")
    .max(850, "Credit score must be 300–850"),
  debtToIncomeRatio: z.coerce
    .number()
    .min(0, "Must be 0–1")
    .max(1, "Must be 0–1"),
  loanAmount: z.coerce.number().min(1000, "Loan amount must be at least $1,000"),
  loanPurpose: z.string().min(1, "Select a loan purpose"),
  employmentType: z.string().min(1, "Select your employment type"),
});

type FormValues = z.infer<typeof schema>;

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Financial", icon: CreditCard },
  { id: 3, label: "Loan Details", icon: DollarSign },
  { id: 4, label: "Review & Submit", icon: ClipboardList },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Application steps" className="mb-8 flex items-center justify-center gap-0">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div
            aria-current={current === step.id ? "step" : undefined}
            aria-label={`Step ${step.id}: ${step.label}${current > step.id ? " (completed)" : current === step.id ? " (current)" : ""}`}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 ${
              current === step.id
                ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900"
                : current > step.id
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
            }`}
          >
            {current > step.id ? <CheckCircle2 className="h-4 w-4" /> : step.id}
          </div>
          <span
            className={`ml-2 mr-1 hidden text-sm font-medium sm:block transition-colors ${
              current === step.id
                ? "text-blue-700 dark:text-blue-400"
                : current > step.id
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`mx-2 h-0.5 w-8 sm:w-12 transition-colors duration-300 ${
                current > step.id ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          )}
        </div>
      ))}
    </nav>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Label>
        {hint && <span className="text-xs text-slate-400 dark:text-slate-500">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Review section ───────────────────────────────────────────────────────────

function ReviewSection({
  title,
  step,
  onEdit,
  rows,
}: {
  title: string;
  step: number;
  onEdit: (s: number) => void;
  rows: { label: string; value: React.ReactNode }[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</span>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between px-4 py-2.5 text-sm"
          >
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
            <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LoanApplicationFormPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const { mutate, isPending, error } = useCreateLoan();

  // Load saved draft from localStorage
  const savedDraft = (() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Partial<FormValues>) : null;
    } catch {
      return null;
    }
  })();

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      applicantName:
        savedDraft?.applicantName ??
        `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
      applicantEmail:
        savedDraft?.applicantEmail ??
        (user?.primaryEmailAddress?.emailAddress ?? ""),
      income: savedDraft?.income,
      creditScore: savedDraft?.creditScore,
      debtToIncomeRatio: savedDraft?.debtToIncomeRatio ?? 0.3,
      loanAmount: savedDraft?.loanAmount,
      loanPurpose: savedDraft?.loanPurpose,
      employmentType: savedDraft?.employmentType,
    },
  });

  // Track whether there's an active draft
  useEffect(() => {
    setHasDraft(!!localStorage.getItem(DRAFT_STORAGE_KEY));
  }, []);

  // Persist draft to localStorage
  const persistDraft = useCallback(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(getValues()));
      setHasDraft(true);
    } catch {
      // ignore
    }
  }, [getValues]);

  // Restore select values from draft (react-hook-form doesn't auto-restore controlled selects)
  useEffect(() => {
    if (savedDraft?.loanPurpose) setValue("loanPurpose", savedDraft.loanPurpose);
    if (savedDraft?.employmentType) setValue("employmentType", savedDraft.employmentType);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function nextStep() {
    const fieldsPerStep: Record<number, (keyof FormValues)[]> = {
      1: ["applicantName", "applicantEmail"],
      2: ["income", "creditScore", "debtToIncomeRatio"],
      3: ["loanAmount", "loanPurpose", "employmentType"],
    };
    const valid = await trigger(fieldsPerStep[step]);
    if (valid) {
      persistDraft();
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goToStep(s: number) {
    persistDraft();
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSubmit(data: FormValues) {
    mutate(
      { ...data, userId: user?.id ?? "anonymous" },
      {
        onSuccess: (loan) => {
          // Clear draft on successful submit
          try { localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* ignore */ }
          navigate(`/portal/application/${loan.id}`);
        },
      }
    );
  }

  const vals = getValues();

  const dtiPercent =
    vals.debtToIncomeRatio != null
      ? `${(Number(vals.debtToIncomeRatio) * 100).toFixed(0)}%`
      : "—";

  const dtiRisk =
    Number(vals.debtToIncomeRatio) > 0.43
      ? "high"
      : Number(vals.debtToIncomeRatio) > 0.35
      ? "moderate"
      : "good";

  const creditRisk =
    Number(vals.creditScore) >= 740
      ? "excellent"
      : Number(vals.creditScore) >= 670
      ? "good"
      : Number(vals.creditScore) >= 580
      ? "fair"
      : "poor";

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Loan Application</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Fill in your details and get an AI-powered decision in minutes.
        </p>
      </div>

      <StepIndicator current={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                {(() => {
                  const s = STEPS[step - 1];
                  const Icon = s.icon;
                  return (
                    <>
                      <Icon className="h-4 w-4 text-blue-600" />
                      {s.label}
                    </>
                  );
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step 1 — Personal */}
                {step === 1 && (
                  <div className="space-y-4">
                    <Field label="Full Name" error={errors.applicantName?.message}>
                      <Input
                        {...register("applicantName")}
                        placeholder="Jane Doe"
                        className={errors.applicantName ? "border-red-400" : ""}
                      />
                    </Field>
                    <Field label="Email Address" error={errors.applicantEmail?.message}>
                      <Input
                        {...register("applicantEmail")}
                        type="email"
                        placeholder="jane@example.com"
                        className={errors.applicantEmail ? "border-red-400" : ""}
                      />
                    </Field>
                    <Field
                      label="NRIC / FIN (optional)"
                      hint="Singapore residents only"
                      error={errors.nric?.message}
                    >
                      <Input
                        {...register("nric")}
                        placeholder="e.g. S1234567D"
                        className={errors.nric ? "border-red-400" : ""}
                      />
                    </Field>
                    <div className="flex items-start gap-2 rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-3 text-xs text-blue-600 dark:text-blue-400">
                      <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>
                        Open to Singapore Citizens, Permanent Residents, and valid Work Pass holders.
                        Your NRIC is optional and used only for identity verification.
                      </span>
                    </div>

                    {/* Document upload */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Supporting Documents{" "}
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">(optional — speeds up verification)</span>
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          { type: "payslip", label: "Latest Payslip" },
                          { type: "employment_letter", label: "Employment Letter" },
                          { type: "bank_statement", label: "Bank Statement" },
                          { type: "nric", label: "NRIC / Work Pass" },
                        ].map(({ type, label }) => (
                          <label
                            key={type}
                            className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/60 px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                          >
                            <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" />
                            <Save className="h-3.5 w-3.5 group-hover:text-blue-500" />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        AI-powered document verification extracts and validates data automatically.
                        Files are encrypted at rest and never shared with third parties.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2 — Financial */}
                {step === 2 && (
                  <div className="space-y-4">
                    <Field
                      label="Annual Income"
                      hint="before taxes"
                      error={errors.income?.message}
                    >
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">$</span>
                        <Input
                          {...register("income")}
                          type="number"
                          placeholder="85,000"
                          className={`pl-7 ${errors.income ? "border-red-400" : ""}`}
                        />
                      </div>
                    </Field>
                    <Field
                      label="Credit Score"
                      hint="300 – 850"
                      error={errors.creditScore?.message}
                    >
                      <Input
                        {...register("creditScore")}
                        type="number"
                        placeholder="720"
                        min={300}
                        max={850}
                        className={errors.creditScore ? "border-red-400" : ""}
                      />
                    </Field>
                    <Field
                      label="Debt-to-Income Ratio"
                      hint="monthly debt ÷ gross income"
                      error={errors.debtToIncomeRatio?.message}
                    >
                      <Input
                        {...register("debtToIncomeRatio")}
                        type="number"
                        step="0.01"
                        placeholder="0.30"
                        min={0}
                        max={1}
                        className={errors.debtToIncomeRatio ? "border-red-400" : ""}
                      />
                    </Field>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Tip: a DTI below 36% is generally considered healthy by lenders.
                    </p>
                  </div>
                )}

                {/* Step 3 — Loan */}
                {step === 3 && (
                  <div className="space-y-4">
                    <Field
                      label="Loan Amount"
                      error={errors.loanAmount?.message}
                    >
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">$</span>
                        <Input
                          {...register("loanAmount")}
                          type="number"
                          placeholder="150,000"
                          className={`pl-7 ${errors.loanAmount ? "border-red-400" : ""}`}
                        />
                      </div>
                    </Field>
                    <Field label="Loan Purpose" error={errors.loanPurpose?.message}>
                      <Select
                        onValueChange={(v) =>
                          setValue("loanPurpose", v, { shouldValidate: true })
                        }
                        defaultValue={vals.loanPurpose}
                      >
                        <SelectTrigger
                          className={errors.loanPurpose ? "border-red-400" : ""}
                        >
                          <SelectValue placeholder="Select purpose…" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "Home Purchase",
                            "Refinance",
                            "Business",
                            "Personal",
                            "Auto",
                            "Education",
                            "Debt Consolidation",
                          ].map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field
                      label="Employment Type"
                      error={errors.employmentType?.message}
                    >
                      <Select
                        onValueChange={(v) =>
                          setValue("employmentType", v, { shouldValidate: true })
                        }
                        defaultValue={vals.employmentType}
                      >
                        <SelectTrigger
                          className={errors.employmentType ? "border-red-400" : ""}
                        >
                          <SelectValue placeholder="Select type…" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "Full-time",
                            "Part-time",
                            "Self-employed",
                            "Contract",
                            "Unemployed",
                          ].map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                )}

                {/* Step 4 — Review & Submit */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div className="rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 px-4 py-3 text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
                      <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                      <p>
                        Please review your application details carefully. You can edit any
                        section before submitting. Once submitted, changes cannot be made.
                      </p>
                    </div>

                    <ReviewSection
                      title="Personal Information"
                      step={1}
                      onEdit={goToStep}
                      rows={[
                        { label: "Full Name", value: vals.applicantName || "—" },
                        { label: "Email Address", value: vals.applicantEmail || "—" },
                      ]}
                    />

                    <ReviewSection
                      title="Financial Profile"
                      step={2}
                      onEdit={goToStep}
                      rows={[
                        {
                          label: "Annual Income",
                          value: vals.income
                            ? `$${Number(vals.income).toLocaleString()}`
                            : "—",
                        },
                        {
                          label: "Credit Score",
                          value: vals.creditScore ? (
                            <span className="flex items-center gap-2">
                              {vals.creditScore}
                              <Badge
                                className={`text-xs ${
                                  creditRisk === "excellent"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : creditRisk === "good"
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : creditRisk === "fair"
                                    ? "bg-amber-100 text-amber-700 border-amber-200"
                                    : "bg-red-100 text-red-700 border-red-200"
                                }`}
                              >
                                {creditRisk}
                              </Badge>
                            </span>
                          ) : (
                            "—"
                          ),
                        },
                        {
                          label: "Debt-to-Income Ratio",
                          value: vals.debtToIncomeRatio ? (
                            <span className="flex items-center gap-2">
                              {dtiPercent}
                              <Badge
                                className={`text-xs ${
                                  dtiRisk === "good"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : dtiRisk === "moderate"
                                    ? "bg-amber-100 text-amber-700 border-amber-200"
                                    : "bg-red-100 text-red-700 border-red-200"
                                }`}
                              >
                                {dtiRisk === "good"
                                  ? "healthy"
                                  : dtiRisk === "moderate"
                                  ? "moderate"
                                  : "high"}
                              </Badge>
                            </span>
                          ) : (
                            "—"
                          ),
                        },
                      ]}
                    />

                    <ReviewSection
                      title="Loan Details"
                      step={3}
                      onEdit={goToStep}
                      rows={[
                        {
                          label: "Loan Amount",
                          value: vals.loanAmount
                            ? `$${Number(vals.loanAmount).toLocaleString()}`
                            : "—",
                        },
                        { label: "Purpose", value: vals.loanPurpose || "—" },
                        { label: "Employment Type", value: vals.employmentType || "—" },
                      ]}
                    />

                    <Separator />

                    {/* Confirmation */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 space-y-3">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Confirm & Submit
                      </p>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <Checkbox
                          id="confirm"
                          checked={confirmed}
                          onCheckedChange={(v) => setConfirmed(!!v)}
                          className="mt-0.5"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          I confirm that the information provided is accurate and complete.
                          I understand this application will be reviewed by an AI system and a
                          loan officer. I agree to the{" "}
                          <a
                            href="/terms"
                            className="text-blue-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a
                            href="/privacy"
                            className="text-blue-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Privacy Policy
                          </a>
                          .
                        </span>
                      </label>
                    </div>

                    {!confirmed && (
                      <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 rounded-lg px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        Please check the confirmation box to submit your application.
                      </div>
                    )}

                    {error && (
                      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-600 dark:text-red-400">
                        {(error as Error).message ||
                          "Submission failed. Please try again."}
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="mt-6 flex justify-between items-center">
                  {step > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => goToStep(step - 1)}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < 4 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 min-w-[160px]"
                      disabled={isPending || !confirmed}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Submit Application
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Progress indicator */}
      <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
        Step {step} of {STEPS.length}
        {hasDraft && step < 4 && (
          <>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <Save className="h-3 w-3 text-emerald-500" aria-hidden="true" />
            <span className="text-emerald-600">Draft saved</span>
          </>
        )}
        {step === 4 && <><span className="text-slate-300 dark:text-slate-600">·</span> Ready to submit</>}
      </p>
    </div>
  );
}
