import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
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
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-slate-500">Last updated: October 24, 2024</p>
        </div>

        <div className="space-y-10 text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              1. Terms
            </h2>
            <p className="leading-relaxed">
              By accessing the website at AI Floor Analyzer, you are agreeing to
              be bound by these terms of service, all applicable laws and
              regulations, and agree that you are responsible for compliance
              with any applicable local laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              2. Use License
            </h2>
            <p className="leading-relaxed mb-4">
              Permission is granted to temporarily download one copy of the
              materials (information or software) on AI Floor Analyzer's website
              for personal, non-commercial transitory viewing only.
            </p>
            <p className="leading-relaxed">
              This is the grant of a license, not a transfer of title, and under
              this license you may not:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>modify or copy the materials;</li>
              <li>
                use the materials for any commercial purpose, or for any public
                display (commercial or non-commercial);
              </li>
              <li>
                attempt to decompile or reverse engineer any software contained
                on AI Floor Analyzer's website;
              </li>
              <li>
                remove any copyright or other proprietary notations from the
                materials.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              3. Disclaimer
            </h2>
            <p className="leading-relaxed">
              The materials on AI Floor Analyzer's website are provided on an
              'as is' basis. AI Floor Analyzer makes no warranties, expressed or
              implied, and hereby disclaims and negates all other warranties
              including, without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or
              non-infringement of intellectual property or other violation of
              rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              4. Limitations
            </h2>
            <p className="leading-relaxed">
              In no event shall AI Floor Analyzer or its suppliers be liable for
              any damages (including, without limitation, damages for loss of
              data or profit, or due to business interruption) arising out of
              the use or inability to use the materials on AI Floor Analyzer's
              website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
