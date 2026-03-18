import { useEffect, useState } from "react";
import { Mail, MessageCircle, HelpCircle, Info, Loader2, CheckCircle2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Link } from "react-router-dom";
import { apiClient } from "@/lib/api-client";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Contact — LoanWise AI";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));
    setIsSubmitting(true);
    try {
      await apiClient<{ success: boolean; id: string; message: string }>("/contact", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
        }),
      });
      setSubmitted(true);
      form.reset();
      toast.success("Message received! We'll get back to you within 1–2 business days.");
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicPageLayout>
      <div className="space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white mb-3">Get in Touch</h1>
          <p className="text-lg text-slate-400">We're here to help. Reach out via any channel below.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Contact Channels</h2>
            {[
              { icon: Mail, title: "Email Support", value: "support@loanwise.ai", desc: "For account and application queries", href: null },
              { icon: MessageCircle, title: "General Enquiries", value: "hello@loanwise.ai", desc: "Partnership, press, and feedback", href: null },
              { icon: HelpCircle, title: "Help Center", value: "View FAQs →", desc: "Self-service documentation", href: "/help" },
            ].map(({ icon: Icon, title, value, desc, href }) => (
              <div key={title} className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/30 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{title}</p>
                  {href ? (
                    <Link to={href} className="text-sm text-cyan-400 hover:underline">{value}</Link>
                  ) : (
                    <p className="text-sm text-cyan-400">{value}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-white">Send a Message</h2>
            {submitted && (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Your message has been saved. We'll respond within 1–2 business days.</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name" className="text-xs text-slate-300">Name</Label>
                <Input id="contact-name" placeholder="Jane Smith" required className="h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-email" className="text-xs text-slate-300">Email</Label>
                <Input id="contact-email" type="email" placeholder="jane@example.com" required className="h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-subject" className="text-xs text-slate-300">Subject</Label>
              <Input id="contact-subject" placeholder="How can we help?" required className="h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-message" className="text-xs text-slate-300">Message</Label>
              <Textarea id="contact-message" placeholder="Describe your query in detail…" rows={5} required className="text-sm resize-none bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-cyan-500 text-[#0A0F1C] hover:bg-cyan-400"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </form>
        </div>

        {/* FAQ accordion */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              { q: "How long does a loan review take?", a: "Once submitted, applications are reviewed by a bank manager who triggers the AI analysis. The full AI pipeline typically completes in under 60 seconds. You'll see a status update immediately." },
              { q: "What if my application is denied?", a: "If denied, our AI will explain the specific factors that influenced the decision and suggest alternative products that may better match your profile. You can contact us if you believe there's an error." },
              { q: "Is my financial data secure?", a: "Yes. All data is transmitted over HTTPS and stored in an encrypted database. We never share your financial data with third parties except as described in our Privacy Policy." },
              { q: "Can I withdraw my application?", a: "Yes — you can withdraw a queued (not yet processed) application from your application status page." },
              { q: "What is the manager secret key for?", a: "The manager secret is used internally by bank administrators to register manager accounts. It is not needed for standard customer applications." },
            ].map(({ q, a }) => (
              <details key={q} className="group rounded-xl border border-white/10 bg-white/5 px-5 py-4 cursor-pointer">
                <summary className="flex items-center justify-between text-sm font-semibold text-white list-none [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="ml-2 text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
}
