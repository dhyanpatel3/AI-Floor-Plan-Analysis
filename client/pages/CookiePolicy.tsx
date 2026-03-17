import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CookiePolicy = () => {
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
          <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-slate-500">Last updated: October 24, 2024</p>
        </div>

        <div className="space-y-10 text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              1. What Are Cookies
            </h2>
            <p className="leading-relaxed">
              As is common practice with almost all professional websites, this
              site uses cookies, which are tiny files that are downloaded to
              your computer, to improve your experience. This page describes
              what information they gather, how we use it and why we sometimes
              need to store these cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              2. How We Use Cookies
            </h2>
            <p className="leading-relaxed">
              We use cookies for a variety of reasons detailed below.
              Unfortunately, in most cases, there are no industry standard
              options for disabling cookies without completely disabling the
              functionality and features they add to this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              3. The Cookies We Set
            </h2>
            <ul className="list-disc pl-6 space-y-4">
              <li>
                <strong>Account related cookies:</strong> If you create an
                account with us, then we will use cookies for the management of
                the signup process and general administration.
              </li>
              <li>
                <strong>Login related cookies:</strong> We use cookies when you
                are logged in so that we can remember this fact. This prevents
                you from having to log in every single time you visit a new
                page.
              </li>
              <li>
                <strong>Site preferences cookies:</strong> In order to provide
                you with a great experience on this site, we provide the
                functionality to set your preferences for how this site runs
                when you use it. To remember your preferences, we need to set
                cookies.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              4. Disabling Cookies
            </h2>
            <p className="leading-relaxed">
              You can prevent the setting of cookies by adjusting the settings
              on your browser (see your browser Help for how to do this). Be
              aware that disabling cookies will affect the functionality of this
              and many other websites that you visit.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
