import { Link } from "react-router-dom";
import {
  Zap,
  ShieldCheck,
  BrainCircuit,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  BarChart3,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ─── Nav ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">LoanWise AI</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              How it Works
            </a>
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Features
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/sign-in">Manager Login</Link>
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
              <Link to="/sign-up">
                Apply Now <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white px-6 pb-24 pt-20">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-100/60 blur-3xl" />
          <div className="absolute -left-20 top-60 h-[300px] w-[300px] rounded-full bg-indigo-100/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <Badge className="mb-6 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
            <Sparkles className="mr-1.5 h-3 w-3" />
            Powered by AI Agents
          </Badge>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
            AI-Powered Loan Decisions{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              in Seconds
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600">
            Submit your loan application and get an instant risk assessment, bias-free decision,
            and personalised product recommendations — all driven by intelligent AI agents.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="bg-blue-600 px-8 hover:bg-blue-700" asChild>
              <Link to="/sign-up">
                Apply for a Loan <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8" asChild>
              <a href="#how-it-works">See How it Works</a>
            </Button>
          </div>

          {/* Stat strip */}
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-slate-100 pt-10">
            {[
              { value: "< 5s", label: "Decision Time" },
              { value: "80%+", label: "Process Automation" },
              { value: "95%+", label: "Bias Detection Accuracy" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-blue-600">{s.value}</p>
                <p className="mt-1 text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight">
              Everything powered by AI agents
            </h2>
            <p className="text-slate-500">
              Four specialised agents work together to evaluate your application.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
                title: "Instant Risk Assessment",
                desc: "Our RiskAssessor agent analyses your credit profile, income, and DTI ratio to compute a precise risk score.",
                bg: "bg-blue-50",
              },
              {
                icon: <Sparkles className="h-6 w-6 text-indigo-600" />,
                title: "AI Email Generation",
                desc: "The EmailGenerator agent drafts a clear, professional decision letter tailored specifically to your application.",
                bg: "bg-indigo-50",
              },
              {
                icon: <ShieldCheck className="h-6 w-6 text-emerald-600" />,
                title: "Bias-Free Decisions",
                desc: "Every communication is scanned by the BiasDetector agent to ensure fair, equitable language and zero discrimination.",
                bg: "bg-emerald-50",
              },
              {
                icon: <Zap className="h-6 w-6 text-amber-600" />,
                title: "Smart Recommendations",
                desc: "If denied, the ProductRecommender suggests alternative financial products best matched to your current situation.",
                bg: "bg-amber-50",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className={`mb-4 inline-flex rounded-xl p-3 ${f.bg}`}>{f.icon}</div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight">How it works</h2>
            <p className="text-slate-500">Three simple steps to get your loan decision.</p>
          </div>
          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connector line */}
            <div className="absolute left-1/2 top-8 hidden h-0.5 w-2/3 -translate-x-1/2 bg-blue-100 md:block" />
            {[
              {
                step: "01",
                icon: <Lock className="h-6 w-6 text-white" />,
                title: "Create Account & Apply",
                desc: "Sign up securely with Clerk authentication and fill in your loan application in our guided multi-step form.",
              },
              {
                step: "02",
                icon: <BrainCircuit className="h-6 w-6 text-white" />,
                title: "AI Pipeline Runs",
                desc: "Four AI agents analyse your application in real time: risk assessment, email drafting, bias checking, and recommendations.",
              },
              {
                step: "03",
                icon: <CheckCircle2 className="h-6 w-6 text-white" />,
                title: "Get Your Decision",
                desc: "Receive a clear decision with your risk score, a personalised email, and alternative product suggestions if needed.",
              },
            ].map((s) => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
                  {s.icon}
                </div>
                <span className="mb-2 text-xs font-bold tracking-widest text-blue-400">
                  STEP {s.step}
                </span>
                <h3 className="mb-2 font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ──────────────────────────────────────────────────── */}
      <section className="bg-blue-600 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to apply? Get a decision in seconds.
          </h2>
          <p className="mb-8 text-blue-100">
            Join thousands of applicants who received fair, instant loan decisions powered by AI.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="bg-white px-8 text-blue-600 hover:bg-blue-50"
              asChild
            >
              <Link to="/sign-up">
                Start Your Application <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent px-8 text-white hover:bg-white/10"
              asChild
            >
              <Link to="/sign-in">Manager Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-slate-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
              <BrainCircuit className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-medium text-slate-600">LoanWise AI</span>
          </div>
          <p>© {new Date().getFullYear()} LoanWise AI. Built with AI-powered agents.</p>
          <div className="flex items-center gap-1 text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-medium">Bias-free decisions</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
