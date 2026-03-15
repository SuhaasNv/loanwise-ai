import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Brain } from "lucide-react";

export default function PrivacyPage() {
  useEffect(() => {
    document.title = "Privacy Policy — LoanWise AI";
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

      <main className="max-w-3xl mx-auto px-6 py-16 prose prose-slate prose-sm">
        <h1>Privacy Policy</h1>
        <p className="lead">Last updated: March 15, 2026</p>

        <h2>1. Information We Collect</h2>
        <p>
          When you use LoanWise AI, we collect information you provide directly, such as your name,
          email address, income, credit score, employment type, and loan purpose when submitting an
          application.
        </p>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To evaluate loan applications using our AI pipeline</li>
          <li>To generate personalised decision letters</li>
          <li>To detect bias and ensure fair lending practices</li>
          <li>To provide product recommendations tailored to your profile</li>
          <li>To communicate with you about your application status</li>
        </ul>

        <h2>3. Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul>
          <li><strong>Clerk</strong> — authentication and identity management</li>
          <li><strong>Google Gemini</strong> — AI-powered risk assessment, email generation, and bias detection</li>
        </ul>

        <h2>4. Data Storage and Security</h2>
        <p>
          Application data is stored in a secure database. We implement industry-standard security
          measures including HTTPS, encrypted connections, and access controls. Your financial data
          is never shared with third parties beyond what is described in this policy.
        </p>

        <h2>5. Your Rights</h2>
        <p>
          You have the right to access, correct, or delete your personal data. Contact us at{" "}
          <a href="mailto:privacy@loanwise.ai">privacy@loanwise.ai</a> to exercise these rights.
        </p>

        <h2>6. Contact</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at{" "}
          <a href="mailto:privacy@loanwise.ai">privacy@loanwise.ai</a>.
        </p>
      </main>
    </div>
  );
}
