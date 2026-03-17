import React from "react";
import { motion } from "framer-motion";
import {
  BriefcaseIcon,
  Coffee,
  Heart,
  GraduationCap,
  Map,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const benefits = [
  {
    icon: <Heart className="w-6 h-6 text-rose-500" />,
    title: "Health & Wellbeing",
    description:
      "Comprehensive medical, dental, and vision coverage for you and your dependents.",
  },
  {
    icon: <Coffee className="w-6 h-6 text-amber-600" />,
    title: "Work-Life Balance",
    description:
      "Unlimited PTO, flexible working hours, and regular company-wide days off.",
  },
  {
    icon: <Map className="w-6 h-6 text-emerald-500" />,
    title: "Work Anywhere",
    description:
      "We are a remote-first company. Work from the comfort of our hub or your favorite coffee shop anywhere in the country.",
  },
  {
    icon: <GraduationCap className="w-6 h-6 text-blue-500" />,
    title: "Learning",
    description:
      "Annual stipend for conferences, courses, and books to support your continuous growth.",
  },
];

const Careers = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-950 py-24 border-b border-slate-200 dark:border-slate-800 relative">
        <div className="container mx-auto px-6 max-w-4xl text-center relative">
          <div className="absolute left-6 top-0 md:-top-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
          >
            Join Our Team
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed"
          >
            Help us build the future of construction technology. We're looking
            for passionate individuals who want to transform an industry.
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20 max-w-7xl">
        {/* Current Openings */}
        <div className="mb-24">
          <div className="flex items-center gap-3 mb-8">
            <BriefcaseIcon className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Open Positions
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-6">
              <BriefcaseIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">
              No Open Roles Currently
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Our team is currently at capacity, but we're always on the lookout
              for great talent. Feel free to send your resume to{" "}
              <a
                href="mailto:careers@aiflooranalyzer.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                careers@aiflooranalyzer.com
              </a>{" "}
              and we'll keep it on file.
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-10 text-center">
            Why Work With Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
              >
                <div className="bg-slate-50 dark:bg-slate-900/50 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-bold mb-3">{benefit.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Careers;
