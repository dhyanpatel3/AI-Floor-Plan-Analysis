import React from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Layout,
  FileText,
  Calculator,
  Shield,
  Cpu,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const featureList = [
  {
    icon: <Zap className="w-8 h-8 text-amber-500" />,
    title: "Instant Analysis",
    description:
      "Upload your floor plan and get comprehensive analysis within seconds using our advanced AI algorithms.",
  },
  {
    icon: <Layout className="w-8 h-8 text-blue-500" />,
    title: "Room Detection",
    description:
      "Automatically identify and categorize different rooms, spaces, and their dimensions with high accuracy.",
  },
  {
    icon: <Calculator className="w-8 h-8 text-emerald-500" />,
    title: "Cost Estimation",
    description:
      "Real-time construction cost estimations based on current market rates and required materials.",
  },
  {
    icon: <FileText className="w-8 h-8 text-purple-500" />,
    title: "Detailed Reports",
    description:
      "Generate professional, exportable PDF reports including breakdown of materials, costs, and spatial data.",
  },
  {
    icon: <Cpu className="w-8 h-8 text-indigo-500" />,
    title: "AI-Powered Insights",
    description:
      "Get smart recommendations for space optimization and material selection based on modern architectural standards.",
  },
  {
    icon: <Shield className="w-8 h-8 text-rose-500" />,
    title: "Secure Data",
    description:
      "Your floor plans and estimation data are securely stored and encrypted with enterprise-grade protection.",
  },
];

const Features = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-950 py-24 sm:py-32 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8 -mt-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="mx-auto max-w-2xl lg:text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400"
            >
              Advanced Capabilities
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
            >
              Everything you need to analyze floor plans
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400"
            >
              Our platform provides a comprehensive suite of tools designed to
              make construction estimation and spatial analysis faster, more
              accurate, and entirely automated.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-6 py-24 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureList.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md dark:hover:border-slate-600 transition-all"
            >
              <div className="bg-slate-50 dark:bg-slate-900/50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 dark:bg-blue-900 py-16 mt-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to streamline your workflow?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
            Join thousands of professionals using our AI platform to analyze
            floor plans and generate instant estimates.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/"
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
            >
              Get started for free
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
