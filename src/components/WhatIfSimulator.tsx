/**
 * WhatIfSimulator — interactive slider-based loan eligibility simulator.
 * Uses a JavaScript port of the Python heuristic risk model so results are
 * instant (no network round-trip required).
 */
import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface WhatIfSimulatorProps {
  initialCreditScore?: number;
  initialDti?: number;
  initialLoanAmount?: number;
  initialIncome?: number;
  initialEmploymentType?: string;
}

// ─── Heuristic model (mirrors pipeline.py) ────────────────────────────────────

function computeRisk(
  creditScore: number,
  dti: number,
  loanAmount: number,
  income: number,
  employmentType: string
): { riskScore: number; approvalProbability: number; decision: "approved" | "denied"; factors: Factor[] } {
  const CREDIT_TIERS: [number, number, string, number][] = [
    [800, 9999, "Exceptional", -0.22],
    [740, 800, "Very Good", -0.15],
    [670, 740, "Good", -0.06],
    [620, 670, "Fair", 0.1],
    [580, 620, "Poor", 0.2],
    [0, 580, "Very Poor", 0.3],
  ];
  const DTI_TIERS: [number, number, string, number][] = [
    [0, 0.2, "Excellent", -0.09],
    [0.2, 0.28, "Good", -0.04],
    [0.28, 0.36, "Acceptable", 0],
    [0.36, 0.43, "Elevated", 0.1],
    [0.43, 0.5, "High", 0.2],
    [0.5, 1, "Very High", 0.32],
  ];
  const LTI_TIERS: [number, number, string, number][] = [
    [0, 1.5, "Conservative", -0.04],
    [1.5, 3.0, "Moderate", 0],
    [3.0, 4.5, "Elevated", 0.05],
    [4.5, 6.0, "High", 0.12],
    [6.0, 999, "Very High", 0.22],
  ];
  const EMP: Record<string, [number, string]> = {
    "Full-time": [-0.03, "Stable full-time employment"],
    "Self-employed": [0.02, "Self-employed — minor income variability"],
    Contract: [0.04, "Contract employment — some income uncertainty"],
    "Part-time": [0.1, "Part-time — limited income stability"],
    Unemployed: [0.28, "No employment — severely limits repayment"],
    Retired: [0.05, "Retired — fixed income"],
    Student: [0.15, "Student — limited income"],
  };

  function tier<T extends [number, number, string, number]>(val: number, tiers: T[]): [string, number] {
    for (const [lo, hi, label, delta] of tiers) {
      if (val >= lo && val < hi) return [label, delta];
    }
    const last = tiers[tiers.length - 1];
    return [last[2], last[3]];
  }

  let risk = 0.45;
  const factors: Factor[] = [];

  const [csLabel, csDelta] = tier(creditScore, CREDIT_TIERS);
  risk += csDelta;
  factors.push({
    name: "Credit Score",
    value: `${creditScore} (${csLabel})`,
    impact: csDelta < 0 ? "positive" : csDelta > 0 ? "negative" : "neutral",
    contribution: Math.round(csDelta * 1000) / 1000,
  });

  const [dtiLabel, dtiDelta] = tier(dti, DTI_TIERS);
  risk += dtiDelta;
  factors.push({
    name: "Debt-to-Income",
    value: `${(dti * 100).toFixed(0)}% (${dtiLabel})`,
    impact: dtiDelta < 0 ? "positive" : dtiDelta > 0 ? "negative" : "neutral",
    contribution: Math.round(dtiDelta * 1000) / 1000,
  });

  const lti = loanAmount / Math.max(income, 1);
  const [ltiLabel, ltiDelta] = tier(lti, LTI_TIERS);
  risk += ltiDelta;
  factors.push({
    name: "Loan-to-Income",
    value: `${lti.toFixed(1)}× (${ltiLabel})`,
    impact: ltiDelta < 0 ? "positive" : ltiDelta > 0 ? "negative" : "neutral",
    contribution: Math.round(ltiDelta * 1000) / 1000,
  });

  const [empDelta, empDetail] = EMP[employmentType] ?? [0.04, "Contract employment"];
  risk += empDelta;
  factors.push({
    name: "Employment",
    value: employmentType,
    impact: empDelta < 0 ? "positive" : empDelta > 0 ? "negative" : "neutral",
    contribution: Math.round(empDelta * 1000) / 1000,
  });

  risk = Math.max(0.04, Math.min(0.96, risk));
  const prob = Math.round((1 - risk) * 100) / 100;
  const decision: "approved" | "denied" = risk < 0.5 ? "approved" : "denied";

  return { riskScore: risk, approvalProbability: prob, decision, factors };
}

interface Factor {
  name: string;
  value: string;
  impact: "positive" | "negative" | "neutral";
  contribution: number;
}

export function WhatIfSimulator({
  initialCreditScore = 650,
  initialDti = 0.35,
  initialLoanAmount = 200000,
  initialIncome = 75000,
  initialEmploymentType = "Full-time",
}: WhatIfSimulatorProps) {
  const [creditScore, setCreditScore] = useState(initialCreditScore);
  const [dti, setDti] = useState(initialDti);
  const [loanAmount, setLoanAmount] = useState(initialLoanAmount);
  const [income, setIncome] = useState(initialIncome);
  const [employmentType, setEmploymentType] = useState(initialEmploymentType);

  const result = useMemo(
    () => computeRisk(creditScore, dti, loanAmount, income, employmentType),
    [creditScore, dti, loanAmount, income, employmentType]
  );

  const approvalPct = Math.round(result.approvalProbability * 100);
  const isApproved = result.decision === "approved";

  return (
    <div className="space-y-6">
      {/* Decision indicator */}
      <div
        className={`flex items-center justify-between rounded-xl p-4 border ${
          isApproved
            ? "border-emerald-200 bg-emerald-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        <div>
          <p className={`text-base font-bold ${isApproved ? "text-emerald-800" : "text-red-800"}`}>
            {isApproved ? "Profile: Likely to Qualify" : "Profile: Needs Improvement"}
          </p>
          <p className={`text-sm ${isApproved ? "text-emerald-600" : "text-red-600"}`}>
            Approval probability: <strong>{approvalPct}%</strong> · Risk score:{" "}
            <strong>{(result.riskScore * 100).toFixed(0)}/100</strong>
          </p>
        </div>
        <Badge
          className={
            isApproved
              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
              : "bg-red-100 text-red-800 border-red-300"
          }
        >
          {isApproved ? "Approved" : "Denied"}
        </Badge>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>High Risk</span>
          <span>Low Risk</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              approvalPct >= 60 ? "bg-emerald-400" : approvalPct >= 40 ? "bg-amber-400" : "bg-red-400"
            }`}
            style={{ width: `${approvalPct}%` }}
          />
        </div>
      </div>

      {/* Sliders */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Credit Score */}
        <SliderField
          label="Credit Score"
          value={creditScore}
          min={300}
          max={850}
          step={10}
          display={`${creditScore}`}
          onChange={setCreditScore}
          color={creditScore >= 700 ? "emerald" : creditScore >= 620 ? "amber" : "red"}
        />

        {/* DTI */}
        <SliderField
          label="Debt-to-Income Ratio"
          value={Math.round(dti * 100)}
          min={5}
          max={65}
          step={1}
          display={`${Math.round(dti * 100)}%`}
          onChange={(v) => setDti(v / 100)}
          color={dti <= 0.36 ? "emerald" : dti <= 0.43 ? "amber" : "red"}
          invert
        />

        {/* Income */}
        <SliderField
          label="Annual Income (SGD)"
          value={income}
          min={20000}
          max={300000}
          step={5000}
          display={`$${(income / 1000).toFixed(0)}k`}
          onChange={setIncome}
          color="blue"
        />

        {/* Loan Amount */}
        <SliderField
          label="Loan Amount (SGD)"
          value={loanAmount}
          min={10000}
          max={800000}
          step={10000}
          display={`$${(loanAmount / 1000).toFixed(0)}k`}
          onChange={setLoanAmount}
          color={loanAmount / income < 3 ? "emerald" : loanAmount / income < 5 ? "amber" : "red"}
          invert
        />
      </div>

      {/* Employment type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Employment Type</label>
        <Select value={employmentType} onValueChange={setEmploymentType}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Full-time", "Part-time", "Self-employed", "Contract", "Unemployed", "Retired", "Student"].map(
              (opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Factor Breakdown</p>
        {result.factors.map((f) => (
          <div key={f.name} className="flex items-center gap-3 rounded-lg bg-slate-50 border border-slate-100 p-2.5">
            {f.impact === "positive" ? (
              <TrendingDown className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : f.impact === "negative" ? (
              <TrendingUp className="h-4 w-4 text-red-500 shrink-0" />
            ) : (
              <Minus className="h-4 w-4 text-slate-400 shrink-0" />
            )}
            <span className="text-sm text-slate-700 flex-1">{f.name}</span>
            <span className="text-xs text-slate-500 truncate max-w-[120px]">{f.value}</span>
            <span
              className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                f.contribution < 0
                  ? "text-emerald-700 bg-emerald-50"
                  : f.contribution > 0
                  ? "text-red-700 bg-red-50"
                  : "text-slate-500 bg-slate-100"
              }`}
            >
              {f.contribution > 0 ? "+" : ""}
              {f.contribution.toFixed(3)}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Instant estimate using the same heuristic model as the full pipeline. Adjust sliders to explore scenarios.
      </p>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  color,
  invert = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
  color: string;
  invert?: boolean;
}) {
  const colorClass =
    color === "emerald"
      ? "text-emerald-600"
      : color === "amber"
      ? "text-amber-600"
      : color === "red"
      ? "text-red-600"
      : "text-blue-600";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className={`text-sm font-bold ${colorClass}`}>{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{invert ? "Better" : min}</span>
        <span>{invert ? "Worse" : max}</span>
      </div>
    </div>
  );
}
