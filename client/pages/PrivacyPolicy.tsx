import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
      <div className="container mx-auto px-6 py-20 max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-slate-500">Last updated: October 24, 2024</p>
        </div>

        <div className="space-y-10 text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              1. Introduction
            </h2>
            <p className="leading-relaxed">
              Your privacy is important to us. It is AI Floor Analyzer's policy
              to respect your privacy regarding any information we may collect
              from you across our website, and other sites we own and operate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              2. Information We Collect
            </h2>
            <h3 className="text-xl font-semibold mb-3 mt-6 text-slate-800 dark:text-slate-200">
              Log Data
            </h3>
            <p className="leading-relaxed mb-4">
              When you visit our website, our servers may automatically log the
              standard data provided by your web browser. This data is
              considered "non-identifying information", as it does not
              personally identify you on its own.
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6 text-slate-800 dark:text-slate-200">
              Personal Information
            </h3>
            <p className="leading-relaxed">
              We may ask for personal information, such as your name, email, and
              payment details when you create an account or process a
              transaction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              3. How We Use Information
            </h2>
            <p className="leading-relaxed mb-4">
              We use the collected information for various purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To provide customer support</li>
              <li>To process your floor plan analysis using AI models</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              4. Data Security
            </h2>
            <p className="leading-relaxed">
              The security of your data is important to us, but remember that no
              method of transmission over the Internet, or method of electronic
              storage is 100% secure. While we strive to use commercially
              acceptable means to protect your Personal Data, we cannot
              guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              5. Contact Us
            </h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy, please
              contact us at{" "}
              <a
                href="mailto:privacy@aiflooranalyzer.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                privacy@aiflooranalyzer.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
