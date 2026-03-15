import { useState } from "react";
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
} from "lucide-react";
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
import { useCreateLoan } from "@/hooks/useCreateLoan";

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  applicantName: z.string().min(2, "Full name is required"),
  applicantEmail: z.string().email("Valid email required"),
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
  { id: 4, label: "Review", icon: ClipboardList },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              current === step.id
                ? "bg-blue-600 text-white"
                : current > step.id
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {current > step.id ? <CheckCircle2 className="h-4 w-4" /> : step.id}
          </div>
          <span
            className={`ml-2 mr-1 hidden text-sm font-medium sm:block ${
              current === step.id ? "text-blue-700" : "text-slate-400"
            }`}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`mx-2 h-0.5 w-8 sm:w-16 ${
                current > step.id ? "bg-emerald-400" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LoanApplicationFormPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const { mutate, isPending, error } = useCreateLoan();

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      applicantName: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
      applicantEmail: user?.primaryEmailAddress?.emailAddress ?? "",
      debtToIncomeRatio: 0.3,
    },
  });

  async function nextStep() {
    const fieldsPerStep: Record<number, (keyof FormValues)[]> = {
      1: ["applicantName", "applicantEmail"],
      2: ["income", "creditScore", "debtToIncomeRatio"],
      3: ["loanAmount", "loanPurpose", "employmentType"],
    };
    const valid = await trigger(fieldsPerStep[step]);
    if (valid) setStep((s) => s + 1);
  }

  function onSubmit(data: FormValues) {
    mutate(
      {
        ...data,
        userId: user?.id ?? "anonymous",
      },
      {
        onSuccess: (loan) => {
          navigate(`/portal/application/${loan.id}`);
        },
      }
    );
  }

  const vals = getValues();

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Loan Application</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fill in your details and get an AI-powered decision instantly.
        </p>
      </div>

      <StepIndicator current={step} />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
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
              </div>
            )}

            {/* Step 2 — Financial */}
            {step === 2 && (
              <div className="space-y-4">
                <Field label="Annual Income ($)" error={errors.income?.message}>
                  <Input
                    {...register("income")}
                    type="number"
                    placeholder="85000"
                    className={errors.income ? "border-red-400" : ""}
                  />
                </Field>
                <Field
                  label="Credit Score (300–850)"
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
                  label="Debt-to-Income Ratio (0.00–1.00)"
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
              </div>
            )}

            {/* Step 3 — Loan */}
            {step === 3 && (
              <div className="space-y-4">
                <Field label="Loan Amount ($)" error={errors.loanAmount?.message}>
                  <Input
                    {...register("loanAmount")}
                    type="number"
                    placeholder="150000"
                    className={errors.loanAmount ? "border-red-400" : ""}
                  />
                </Field>
                <Field label="Loan Purpose" error={errors.loanPurpose?.message}>
                  <Select
                    onValueChange={(v) => setValue("loanPurpose", v, { shouldValidate: true })}
                    defaultValue={vals.loanPurpose}
                  >
                    <SelectTrigger className={errors.loanPurpose ? "border-red-400" : ""}>
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
                <Field label="Employment Type" error={errors.employmentType?.message}>
                  <Select
                    onValueChange={(v) => setValue("employmentType", v, { shouldValidate: true })}
                    defaultValue={vals.employmentType}
                  >
                    <SelectTrigger className={errors.employmentType ? "border-red-400" : ""}>
                      <SelectValue placeholder="Select type…" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Full-time", "Part-time", "Self-employed", "Contract", "Unemployed"].map(
                        (t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}

            {/* Step 4 — Review */}
            {step === 4 && (
              <div className="space-y-3">
                {[
                  ["Full Name", vals.applicantName],
                  ["Email", vals.applicantEmail],
                  ["Annual Income", `$${Number(vals.income).toLocaleString()}`],
                  ["Credit Score", vals.creditScore],
                  ["DTI Ratio", vals.debtToIncomeRatio],
                  ["Loan Amount", `$${Number(vals.loanAmount).toLocaleString()}`],
                  ["Loan Purpose", vals.loanPurpose],
                  ["Employment Type", vals.employmentType],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm"
                  >
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-slate-900">{value}</span>
                  </div>
                ))}
                {error && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {(error as Error).message || "Submission failed. Please try again."}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isPending}
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
    </div>
  );
}
