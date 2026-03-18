import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Brain, Shield, Zap, Users, Lock, Gauge, Database, AlertTriangle, KeyRound, ShieldCheck } from "lucide-react";
import { PublicPageLayout } from "@/components/PublicPageLayout";

export default function AboutPage() {
  useEffect(() => {
    document.title = "About — LoanWise AI";
  }, []);

  return (
    <PublicPageLayout>
      <div className="space-y-12">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-4">About LoanWise AI</h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            LoanWise AI is a next-generation loan origination platform that uses artificial
            intelligence to help banks and financial institutions make faster, fairer, and more
            transparent lending decisions.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              icon: Brain,
              title: "AI-Powered Decisions",
              desc: "Our multi-agent pipeline (RiskAssessor, EmailGenerator, BiasDetector, ProductRecommender) analyzes each application against industry-standard lending guidelines.",
            },
            {
              icon: Shield,
              title: "Fair & Explainable",
              desc: "Every decision comes with a detailed breakdown of the factors that influenced it. We screen for bias and toxicity in all generated communications.",
            },
            {
              icon: Zap,
              title: "Real-Time Processing",
              desc: "Applications are processed asynchronously, with live status updates and automatic notifications when decisions are ready.",
            },
            {
              icon: Users,
              title: "Two-Sided Platform",
              desc: "Customers apply with a guided, multi-step form. Bank managers review and approve applications through a powerful dashboard with analytics.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center ring-1 ring-cyan-500/30">
                <Icon className="h-5 w-5 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Security section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/30">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Security &amp; Privacy</h2>
              <p className="text-sm text-slate-400">Enterprise-grade protections built in from the ground up.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Lock,
                title: "JWT Authentication",
                desc: "Every API call is verified against Clerk-issued RS256 JWTs. Role claims are always derived from the server-side database — never trusted from client headers.",
                color: "cyan",
              },
              {
                icon: Gauge,
                title: "Per-Route Rate Limiting",
                desc: "All endpoints are individually rate-limited (5–60 req/min depending on sensitivity). A global 200 req/min ceiling prevents burst abuse on any IP.",
                color: "amber",
              },
              {
                icon: Database,
                title: "Row-Level Security",
                desc: "Every database query is scoped to the authenticated user. Customers can never read, write, or enumerate loan records that belong to other users.",
                color: "violet",
              },
              {
                icon: AlertTriangle,
                title: "IDOR Prevention",
                desc: "Object ownership is enforced at the data layer for every resource — loans, documents, and product interests — before any action is taken.",
                color: "rose",
              },
              {
                icon: KeyRound,
                title: "Security Response Headers",
                desc: "Every response includes X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, and Permissions-Policy headers to harden clients.",
                color: "sky",
              },
              {
                icon: Shield,
                title: "Bias &amp; Fairness Auditing",
                desc: "All AI-generated decisions and loan emails are screened by our BiasDetector agent. Full audit trails are immutably stored for every state change.",
                color: "emerald",
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className={`rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3`}
              >
                <div className={`h-9 w-9 rounded-lg bg-${color}-500/10 flex items-center justify-center ring-1 ring-${color}-500/30`}>
                  <Icon className={`h-4 w-4 text-${color}-400`} />
                </div>
                <h3 className="font-semibold text-white text-sm">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 text-center">
            LoanWise AI follows OWASP API Security Top 10 guidelines. All sensitive endpoints require authentication; manager routes require an additional role check.
          </p>
        </div>

        <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Ready to experience it?</h2>
          <p className="text-slate-400">Apply for a loan or manage applications as a bank manager.</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link to="/sign-up" className="px-5 py-2.5 rounded-xl bg-cyan-500 text-[#0A0F1C] font-semibold text-sm hover:bg-cyan-400 transition-colors">
              Apply Now
            </Link>
            <Link to="/sign-in" className="px-5 py-2.5 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors">
              Manager Login
            </Link>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
}
