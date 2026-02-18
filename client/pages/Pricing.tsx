import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Zap, Star, Shield, Users, ArrowLeft } from "lucide-react";
import { Header } from "../components/Header";

interface PricingProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Pricing: React.FC<PricingProps> = ({ isDarkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const plans = [
    {
      name: "Free Starter",
      price: "$0",
      period: "/forever",
      credits: "5 Credits",
      description: "Perfect for trying out our AI analysis.",
      features: [
        "5 Free Analysis Credits",
        "Basic Floor Plan Detection",
        "Standard Processing Speed",
        "Export to PDF",
        "Community Support",
      ],
      buttonText: "Current Plan",
      buttonVariant: "outline",
      recommended: false,
    },
    {
      name: "Pro Estimator",
      price: "$29",
      period: "/month",
      credits: "50 Credits",
      description: " ideal for independent contractors & architects.",
      features: [
        "50 Credits per Month",
        "Advanced Quantity Takeoff",
        "Priority Processing",
        "Detailed Material Breakdown",
        "Save Unlimited Projects",
        "Email Support",
      ],
      buttonText: "Upgrade to Pro",
      buttonVariant: "primary",
      recommended: true,
    },
    {
      name: "Business",
      price: "$99",
      period: "/month",
      credits: "Unlimited",
      description: "For construction firms and high-volume usage.",
      features: [
        "Unlimited Analysis",
        "Team Collaboration",
        "API Access",
        "Custom Branding on Reports",
        "Dedicated Account Manager",
        "24/7 Priority Support",
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline",
      recommended: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center">
          <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
            Pricing
          </h2>
          <p className="mt-1 text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
             Choose the best plan for your self
          </p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-slate-500 dark:text-slate-400">
            Choose the plan that best fits your construction estimation needs.
            No hidden fees.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:gap-x-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border ${
                plan.recommended
                  ? "border-indigo-600 shadow-2xl z-10 scale-105"
                  : "border-slate-200 dark:border-slate-700 shadow-sm"
              } bg-white dark:bg-slate-800 p-8 transition-transform hover:-translate-y-1 hover:shadow-lg`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                  <span className="inline-flex rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold text-white shadow-sm">
                    Recommended
                  </span>
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {plan.name}
                </h3>
                {plan.recommended ? (
                  <p className="absolute top-0 -translate-y-1/2 bg-indigo-500 text-white px-3 py-0.5 rounded-full text-sm font-semibold transform shadow-sm">
                    Most Popular
                  </p>
                ) : null}

                <p className="mt-4 flex items-baseline text-slate-900 dark:text-white">
                  <span className="text-5xl font-extrabold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="ml-1 text-xl font-semibold text-slate-500 dark:text-slate-400">
                    {plan.period}
                  </span>
                </p>
                <p className="mt-2 text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                  <Zap className="w-4 h-4 fill-current" /> {plan.credits}
                </p>
                <p className="mt-6 text-slate-500 dark:text-slate-400">
                  {plan.description}
                </p>

                <ul role="list" className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex">
                      <Check
                        className="h-6 w-6 flex-shrink-0 text-green-500"
                        aria-hidden="true"
                      />
                      <span className="ml-3 text-slate-500 dark:text-slate-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  className={`block w-full rounded-lg px-6 py-3 text-center text-sm font-semibold leading-6 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                    plan.buttonVariant === "primary"
                      ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/30"
                      : "bg-indigo-50 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-slate-600"
                  }`}
                  onClick={() => {
                    // Demo Logic: Simulate purchase
                    alert(
                      "This is a demo. In a real app, this would open Stripe/PayPal.",
                    );
                  }}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mb-4">
                <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Secure Payments
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Processed securely via Stripe. We never store credit card
                details.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mb-4">
                <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Instant Activation
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Credits are added to your account instantly after purchase.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mb-4">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Team Access
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Share credits and projects with your entire estimation team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
