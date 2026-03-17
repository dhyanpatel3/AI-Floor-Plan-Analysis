import React from "react";
import { motion } from "framer-motion";
import { Play, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const steps = [
  "Upload your PDF or image floor plan",
  "Our AI scans and identifies walls, doors, and rooms",
  "Adjust the calibration scale to set real-world dimensions",
  "Instantly generate cost estimates and material quantities",
  "Export detailed reports for your clients or team",
];

const Demo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-950 py-20 border-b border-slate-200 dark:border-slate-800 relative">
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6"
          >
            <Play className="w-4 h-4 fill-current" />
            Watch it in action
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
          >
            See the Magic Happen
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-600 dark:text-slate-400"
          >
            Discover how AI Floor Analyzer transforms static floor plans into
            actionable data and accurate cost estimates in seconds.
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16 lg:py-24 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Video Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8 w-full aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-2xl group cursor-pointer"
          >
            {/* Decorative background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform duration-300 z-10">
              <Play className="w-8 h-8 text-white fill-current ml-1" />
            </div>
            <span className="text-slate-400 mt-6 font-medium z-10">
              Interactive Demo Video
            </span>

            {/* UI Overlay mockup hint */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
          </motion.div>

          {/* How it works steps */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4 flex flex-col justify-center"
          >
            <h3 className="text-2xl font-bold mb-8">How it works</h3>
            <ul className="space-y-6">
              {steps.map((step, idx) => (
                <li key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 pt-1 leading-relaxed">
                    {step}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
              <Link
                to="/"
                className="inline-flex items-center gap-2 w-full justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm"
              >
                Try it yourself
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Demo;
