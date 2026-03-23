"use client";

import { useEffect, useRef, useState } from "react";
import { BrainCircuit, Mail, Shield, Zap, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Agent definitions ────────────────────────────────────────────────────────

const AGENTS = [
  {
    name: "RiskAssessor",
    label: "Evaluating credit risk",
    icon: BrainCircuit,
    /** Estimated wall-clock ms this agent takes */
    durationMs: 9000,
  },
  {
    name: "EmailGenerator",
    label: "Drafting decision letter",
    icon: Mail,
    durationMs: 7000,
  },
  {
    name: "BiasDetector",
    label: "Scanning for bias & toxicity",
    icon: Shield,
    durationMs: 5000,
  },
  {
    name: "ProductRecommender",
    label: "Finding alternative products",
    icon: Zap,
    durationMs: 7000,
  },
] as const;

/** Map wall-clock elapsed → which agent is active and progress 0–1 within that segment */
function segmentState(elapsed: number): { activeIdx: number; segmentProgress: number } {
  let cursor = 0;
  for (let i = 0; i < AGENTS.length; i++) {
    const seg = AGENTS[i].durationMs;
    if (elapsed < cursor + seg) {
      const segmentProgress = Math.min(1, Math.max(0, (elapsed - cursor) / seg));
      return { activeIdx: i, segmentProgress };
    }
    cursor += seg;
  }
  return { activeIdx: AGENTS.length - 1, segmentProgress: 1 };
}

/** Bar + label use the same value: equal weight per agent so the fill matches the step cards */
function pipelinePercent(elapsed: number, complete: boolean): number {
  if (complete) return 100;
  const { activeIdx, segmentProgress } = segmentState(elapsed);
  const n = AGENTS.length;
  const raw = ((activeIdx + segmentProgress) / n) * 100;
  return Math.min(99, Math.max(0, raw));
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AgentPipelineProgressProps {
  /** Set to true when status === "processing", false when done */
  isRunning: boolean;
  className?: string;
}

export function AgentPipelineProgress({
  isRunning,
  className,
}: AgentPipelineProgressProps) {
  // Elapsed ms since processing started
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // When isRunning transitions true → false, snap to 100 %
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (isRunning) {
      // Reset on every fresh processing start
      setElapsed(0);
      setComplete(false);
      startRef.current = performance.now();

      const tick = () => {
        const now = performance.now();
        const ms = now - (startRef.current ?? now);
        setElapsed(ms);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      // Pipeline finished → fill to 100 %
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      setComplete(true);
    }

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning]);

  const overallPct = pipelinePercent(elapsed, complete);

  const { activeIdx: segIdx } = segmentState(elapsed);
  const activeIdx = complete ? AGENTS.length : segIdx;

  return (
    <div
      role="region"
      aria-label="AI pipeline progress"
      aria-busy={isRunning}
      className={cn(
        "rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/40 p-5 space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
          {complete ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900">
            {complete ? "AI analysis complete" : "AI agents running…"}
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            {complete
              ? "All agents finished — awaiting your decision"
              : `${AGENTS[Math.min(activeIdx, AGENTS.length - 1)].label}…`}
          </p>
        </div>
        <span className="ml-auto text-sm font-bold tabular-nums text-blue-800">
          {Math.round(overallPct)}%
        </span>
      </div>

      {/* Overall bar — scaleX matches the % label (avoids width-% layout quirks in flex pages) */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(overallPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Overall pipeline progress: ${Math.round(overallPct)}%`}
        className="relative h-3 w-full min-w-0 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950/40"
      >
        <div
          className="absolute inset-y-0 left-0 w-full origin-left will-change-transform"
          style={{
            transform: `scaleX(${Math.max(0.002, overallPct / 100)})`,
            transition: complete
              ? "transform 700ms ease-out"
              : "transform 100ms linear",
          }}
        >
          <div
            className={cn(
              "relative h-full w-full rounded-full overflow-hidden",
              complete
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : "bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"
            )}
          >
            {!complete && overallPct > 0 && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                <div className="h-full w-[200%] animate-shimmer bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Per-agent steps */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {AGENTS.map((agent, i) => {
          const done = complete || i < activeIdx;
          const running = !complete && i === activeIdx;
          const waiting = !done && !running;

          const Icon = agent.icon;

          return (
            <div
              key={agent.name}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition-all duration-300",
                done
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : running
                  ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-300/40"
                  : "border-slate-100 bg-white text-slate-400"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
                  done
                    ? "bg-emerald-100 text-emerald-600"
                    : running
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : running ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate leading-tight">{agent.name}</p>
                <p
                  className={cn(
                    "text-[10px] truncate leading-tight",
                    done
                      ? "text-emerald-500"
                      : running
                      ? "text-blue-500"
                      : "text-slate-300"
                  )}
                >
                  {done ? "Complete" : running ? "Running…" : "Waiting"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
