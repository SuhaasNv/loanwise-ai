import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Brain, Mail, MessageCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ContactPage() {
  useEffect(() => {
    document.title = "Contact — LoanWise AI";
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you within 1–2 business days.");
    (e.target as HTMLFormElement).reset();
  };

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

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">Get in Touch</h1>
          <p className="text-lg text-slate-500">We're here to help. Reach out via any channel below.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Contact Channels</h2>
            {[
              { icon: Mail, title: "Email Support", value: "support@loanwise.ai", desc: "For account and application queries" },
              { icon: MessageCircle, title: "General Enquiries", value: "hello@loanwise.ai", desc: "Partnership, press, and feedback" },
              { icon: HelpCircle, title: "Help Center", value: "Coming soon", desc: "Self-service documentation" },
            ].map(({ icon: Icon, title, value, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{title}</p>
                  <p className="text-sm text-blue-600">{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Send a Message</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name" className="text-xs">Name</Label>
                <Input id="contact-name" placeholder="Jane Smith" required className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-email" className="text-xs">Email</Label>
                <Input id="contact-email" type="email" placeholder="jane@example.com" required className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-subject" className="text-xs">Subject</Label>
              <Input id="contact-subject" placeholder="How can we help?" required className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-message" className="text-xs">Message</Label>
              <Textarea id="contact-message" placeholder="Describe your query in detail…" rows={5} required className="text-sm resize-none" />
            </div>
            <Button type="submit" className="w-full">Send Message</Button>
          </form>
        </div>

        {/* FAQ accordion */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              { q: "How long does a loan review take?", a: "Once submitted, applications are reviewed by a bank manager who triggers the AI analysis. The full AI pipeline typically completes in under 60 seconds. You'll see a status update immediately." },
              { q: "What if my application is denied?", a: "If denied, our AI will explain the specific factors that influenced the decision and suggest alternative products that may better match your profile. You can contact us if you believe there's an error." },
              { q: "Is my financial data secure?", a: "Yes. All data is transmitted over HTTPS and stored in an encrypted database. We never share your financial data with third parties except as described in our Privacy Policy." },
              { q: "Can I withdraw my application?", a: "Yes — you can withdraw a queued (not yet processed) application from your application status page." },
              { q: "What is the manager secret key for?", a: "The manager secret is used internally by bank administrators to register manager accounts. It is not needed for standard customer applications." },
            ].map(({ q, a }) => (
              <details key={q} className="group rounded-xl border border-slate-100 px-5 py-4 cursor-pointer">
                <summary className="flex items-center justify-between text-sm font-semibold text-slate-800 list-none [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="ml-2 text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-sm text-slate-500 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
