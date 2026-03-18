import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  CreditCard,
  HelpCircle,
  MessageCircle,
  ChevronDown,
  ArrowRight,
  Zap,
  AlertCircle,
  Users,
} from "lucide-react";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FaqItem {
  q: string;
  a: string;
}

interface Category {
  icon: typeof FileText;
  title: string;
  color: string;
  bg: string;
  faqs: FaqItem[];
}

const CATEGORIES: Category[] = [
  {
    icon: FileText,
    title: "Applying for a Loan",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    faqs: [
      {
        q: "Who can apply for a loan?",
        a: "LoanWise AI is open to Singapore Citizens, Permanent Residents, and valid Work Pass holders. You must be at least 21 years old and have a valid NRIC or Work Pass.",
      },
      {
        q: "What information do I need to apply?",
        a: "You'll need your full name, email, annual income, credit score (self-reported), debt-to-income ratio, loan amount, loan purpose, and employment type. The 4-step form guides you through each section.",
      },
      {
        q: "Can I save my application draft?",
        a: "Yes — the form automatically saves your progress to your browser. If you close the window before submitting, your data will be restored when you return.",
      },
      {
        q: "Can I withdraw my application after submitting?",
        a: "You can withdraw a queued (not yet processed) application from your Application Status page. Once the AI pipeline has started, withdrawal is no longer available.",
      },
      {
        q: "How long does it take to get a decision?",
        a: "Once a manager triggers the AI pipeline, the full analysis typically completes in under 60 seconds. You'll see a real-time status update on your application page, which refreshes every 5 seconds automatically.",
      },
    ],
  },
  {
    icon: Zap,
    title: "Understanding AI Decisions",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    faqs: [
      {
        q: "How does the AI decide on my application?",
        a: "Our RiskAssessor agent evaluates four key factors: Credit Score, Debt-to-Income Ratio (DTI), Loan-to-Income Ratio (LTI), and Employment Type. It compares your profile against CFPB, Fannie Mae conventional, and FHA lending guidelines. A detailed factor breakdown is shown on your application result page.",
      },
      {
        q: "What is a risk score?",
        a: "The risk score (0–100) estimates the likelihood of loan default. Lower is better. A score below 50 generally leads to an approval recommendation; above 50 leads to a denial. The score is computed from your credit profile, DTI, and other factors.",
      },
      {
        q: "Why was my application denied?",
        a: "Your result page shows the specific factors that influenced the decision — such as a credit score below 620, a DTI above 43%, or a loan amount more than 5× your annual income. Each factor includes an explanation and the industry guideline it was compared against.",
      },
      {
        q: "What is the What-If Simulator?",
        a: "For denied applications, we provide an interactive simulator where you can adjust your credit score, DTI, income, and loan amount using sliders to instantly see how profile improvements would affect your approval odds — no credit inquiry involved.",
      },
      {
        q: "Can I appeal a denied decision?",
        a: "Yes. If you believe the decision was made in error, please contact us via the Contact page with your application reference ID. A manager can manually review and override the AI recommendation.",
      },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Fairness & Bias Protection",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    faqs: [
      {
        q: "How does LoanWise AI prevent discrimination?",
        a: "Every AI-generated decision letter is automatically screened by our BiasDetector agent before being shown to you. It checks for language that could reference protected classes (race, religion, gender, age, etc.) or contain toxic phrasing, in accordance with CFPB fair lending rules.",
      },
      {
        q: "What happens if a bias is detected in my letter?",
        a: "The system automatically triggers an email rewrite (up to 2 times) with explicit instructions to remove any biased language. If bias is still detected after retries, the letter is flagged for manager review before being shared.",
      },
      {
        q: "Does the AI use demographic information?",
        a: "No. The AI model only uses financial data: income, credit score, loan amount, DTI, employment type, and loan purpose. Demographic information such as race, gender, nationality, or religion is never collected or used.",
      },
      {
        q: "What is the BiasDetector agent?",
        a: "BiasDetector is a dedicated AI agent powered by Google Gemini 2.5 Flash that reviews every generated email against a CFPB fair lending compliance checklist. It assigns a bias score (0–1) and toxicity score (0–1). Both must be below 0.10 for the email to pass automatically.",
      },
    ],
  },
  {
    icon: CreditCard,
    title: "Alternative Products",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    faqs: [
      {
        q: "What happens when my loan is denied?",
        a: "Our ProductRecommender agent automatically suggests alternative financial products matched to your current profile — such as a personal loan, FHA mortgage, credit-builder card, or savings plan. These are shown on your application result page.",
      },
      {
        q: "What does 'Express Interest' mean?",
        a: "Clicking 'Express Interest' on a recommended product records your interest in our system. A loan officer will follow up with you to discuss whether the product is a good fit and to guide you through the application process.",
      },
      {
        q: "Can I apply for a smaller loan amount?",
        a: "Yes. If your Debt-to-Income Ratio was the main reason for denial, the system automatically calculates a 'Reduced Loan' option at 75% of your original request. This smaller amount may qualify under current lending guidelines.",
      },
    ],
  },
  {
    icon: Users,
    title: "Account & Manager Access",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    faqs: [
      {
        q: "How do I become a manager?",
        a: "Visit the Claim Manager page and enter the manager secret key provided by your bank administrator. Once claimed, your account will have access to the manager dashboard with analytics, loan review, and AI settings.",
      },
      {
        q: "What can a manager do?",
        a: "Managers can review all loan applications, trigger the AI pipeline analysis, approve or deny applications after reviewing AI recommendations, export CSV reports, configure AI settings, manage the product catalog, and view agent activity logs.",
      },
      {
        q: "Is my financial data secure?",
        a: "Yes. All data is transmitted over HTTPS and stored in an encrypted database. Authentication is handled by Clerk (industry-standard JWT). We never share your financial data with third parties except as described in our Privacy Policy.",
      },
    ],
  },
];

function AccordionItem({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-white hover:text-cyan-400 transition-colors"
      >
        {q}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-slate-400 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    document.title = "Help Center — LoanWise AI";
  }, []);

  const cat = CATEGORIES[activeCategory];

  return (
    <PublicPageLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10">
            Self-service documentation
          </Badge>
          <h1 className="text-4xl font-extrabold text-white">Help Center</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Everything you need to know about applying, understanding AI decisions, and getting the
            most from LoanWise AI.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((c, i) => {
            const Icon = c.icon;
            return (
              <button
                key={c.title}
                onClick={() => setActiveCategory(i)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeCategory === i
                    ? "bg-white/10 text-white ring-1 ring-white/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`h-4 w-4 ${c.color}`} />
                {c.title}
              </button>
            );
          })}
        </div>

        {/* Active category */}
        <div className="rounded-2xl border border-white/10 bg-white/5">
          <div className={`flex items-center gap-3 border-b border-white/10 p-6`}>
            <div className={`h-10 w-10 rounded-xl ${cat.bg} flex items-center justify-center ring-1 ring-white/10`}>
              <cat.icon className={`h-5 w-5 ${cat.color}`} />
            </div>
            <div>
              <h2 className="font-semibold text-white">{cat.title}</h2>
              <p className="text-xs text-slate-400">{cat.faqs.length} articles</p>
            </div>
          </div>
          <div className="px-6 divide-y divide-white/10">
            {cat.faqs.map((faq) => (
              <AccordionItem key={faq.q} {...faq} />
            ))}
          </div>
        </div>

        {/* CTA — still need help? */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-transparent p-8 flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-cyan-500/20 flex items-center justify-center ring-1 ring-cyan-500/30">
              <MessageCircle className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Still have questions?</p>
              <p className="text-sm text-slate-400 mt-1">
                Our support team typically responds within 1–2 business days.
              </p>
            </div>
          </div>
          <Button className="shrink-0 bg-cyan-500 text-[#0A0F1C] hover:bg-cyan-400" asChild>
            <Link to="/contact">
              Contact Support <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Quick links */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: AlertCircle, label: "Check Eligibility", desc: "Know before you apply", to: "/eligibility-check", color: "text-cyan-400" },
            { icon: FileText, label: "Apply for a Loan", desc: "Start your application", to: "/sign-up", color: "text-emerald-400" },
            { icon: MessageCircle, label: "Contact Us", desc: "Send us a message", to: "/contact", color: "text-purple-400" },
          ].map(({ icon: Icon, label, desc, to, color }) => (
            <Link
              key={label}
              to={to}
              className="group rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-3 hover:bg-white/10 transition-colors"
            >
              <Icon className={`h-5 w-5 ${color} shrink-0`} />
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </PublicPageLayout>
  );
}
