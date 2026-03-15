import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Brain, Shield, Zap, Users } from "lucide-react";

export default function AboutPage() {
  useEffect(() => {
    document.title = "About — LoanWise AI";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">LoanWise AI</span>
        </Link>
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
          ← Back to Home
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">About LoanWise AI</h1>
          <p className="text-lg text-slate-600 leading-relaxed">
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
            <div key={title} className="rounded-2xl border border-slate-100 p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-blue-600 p-8 text-white text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to experience it?</h2>
          <p className="text-blue-100">Apply for a loan or manage applications as a bank manager.</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link to="/sign-up" className="px-5 py-2.5 rounded-xl bg-white text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-colors">
              Apply Now
            </Link>
            <Link to="/sign-in" className="px-5 py-2.5 rounded-xl border border-blue-400 text-white font-semibold text-sm hover:bg-blue-700 transition-colors">
              Manager Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
