import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Brain, Shield, Zap, Users } from "lucide-react";
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
