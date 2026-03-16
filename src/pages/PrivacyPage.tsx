import { useEffect } from "react";
import { PublicPageLayout } from "@/components/PublicPageLayout";

export default function PrivacyPage() {
  useEffect(() => {
    document.title = "Privacy Policy — LoanWise AI";
  }, []);

  return (
    <PublicPageLayout>
      <div className="prose prose-invert prose-sm max-w-none">
        <h1 className="text-white">Privacy Policy</h1>
        <p className="lead text-slate-400">Last updated: March 15, 2026</p>

        <h2 className="text-white">1. Information We Collect</h2>
        <p className="text-slate-400">
          When you use LoanWise AI, we collect information you provide directly, such as your name,
          email address, income, credit score, employment type, and loan purpose when submitting an
          application.
        </p>

        <h2 className="text-white">2. How We Use Your Information</h2>
        <ul className="text-slate-400">
          <li>To evaluate loan applications using our AI pipeline</li>
          <li>To generate personalised decision letters</li>
          <li>To detect bias and ensure fair lending practices</li>
          <li>To provide product recommendations tailored to your profile</li>
          <li>To communicate with you about your application status</li>
        </ul>

        <h2 className="text-white">3. Third-Party Services</h2>
        <p className="text-slate-400">We use the following third-party services:</p>
        <ul className="text-slate-400">
          <li><strong className="text-white">Clerk</strong> — authentication and identity management</li>
          <li><strong className="text-white">Google Gemini</strong> — AI-powered risk assessment, email generation, and bias detection</li>
        </ul>

        <h2 className="text-white">4. Data Storage and Security</h2>
        <p className="text-slate-400">
          Application data is stored in a secure database. We implement industry-standard security
          measures including HTTPS, encrypted connections, and access controls. Your financial data
          is never shared with third parties beyond what is described in this policy.
        </p>

        <h2 className="text-white">5. Your Rights</h2>
        <p className="text-slate-400">
          You have the right to access, correct, or delete your personal data. Contact us at{" "}
          <a href="mailto:privacy@loanwise.ai" className="text-cyan-400 hover:text-cyan-300">privacy@loanwise.ai</a> to exercise these rights.
        </p>

        <h2 className="text-white">6. Contact</h2>
        <p className="text-slate-400">
          If you have any questions about this Privacy Policy, please contact us at{" "}
          <a href="mailto:privacy@loanwise.ai" className="text-cyan-400 hover:text-cyan-300">privacy@loanwise.ai</a>.
        </p>
      </div>
    </PublicPageLayout>
  );
}
