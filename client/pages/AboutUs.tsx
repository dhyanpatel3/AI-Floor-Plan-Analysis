import React from "react";
import { motion } from "framer-motion";
import { Building2, Users, Target, Globe, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const stats = [
  { label: "Floor Plans Analyzed", value: "50,000+" },
  { label: "Active Users", value: "10,000+" },
  { label: "Time Saved (Hours)", value: "1M+" },
  { label: "Countries Served", value: "45+" },
];

const values = [
  {
    icon: <Target className="w-6 h-6 text-blue-500" />,
    name: "Precision",
    description:
      "We believe in accuracy down to the millimeter. Our AI models are continuously trained on thousands of blueprints to ensure exact measurements and estimations.",
  },
  {
    icon: <Users className="w-6 h-6 text-emerald-500" />,
    name: "Accessibility",
    description:
      "Complex architectural analysis shouldn't require a PhD. We build intuitive tools that make advanced estimation accessible to contractors, realtors, and homeowners.",
  },
  {
    icon: <Globe className="w-6 h-6 text-indigo-500" />,
    name: "Innovation",
    description:
      "We continuously push the boundaries of what is possible with artificial intelligence in the construction and real estate sectors.",
  },
];

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Header Section */}
      <div className="relative isolate overflow-hidden bg-white dark:bg-slate-950 px-6 py-24 sm:py-32 lg:overflow-visible lg:px-0 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 items-center">
          <div className="lg:pr-8 lg:pr-16 lg:pl-16">
            <div className="lg:max-w-lg relative">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8 sm:absolute sm:-top-16"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Our Mission
              </h1>
              <p className="mt-6 text-xl leading-8 text-slate-600 dark:text-slate-400">
                We are revolutionizing the construction estimation process using
                cutting-edge AI technology to transform how professionals
                analyze floor plans.
              </p>
              <p className="mt-6 text-base leading-7 text-slate-600 dark:text-slate-400">
                Founded in 2024, AI Floor Analyzer was created to solve a
                fundamental problem in construction and real estate: manual
                floor plan analysis is time-consuming, prone to human error, and
                expensive. By leveraging state-of-the-art computer vision and
                machine learning, we've automated the entire process.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center p-8 lg:p-0">
            <div className="relative w-full max-w-md aspect-square rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-800/50 shadow-xl overflow-hidden p-2">
              <img
                src="/logo.jpg"
                alt="AI Floor Analyzer Logo"
                className="w-full h-full object-cover rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-24 lg:px-8 mb-24">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="mx-auto flex max-w-xs flex-col gap-y-4"
            >
              <dt className="text-base leading-7 text-slate-600 dark:text-slate-400">
                {stat.label}
              </dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                {stat.value}
              </dd>
            </motion.div>
          ))}
        </dl>
      </div>

      {/* Values Section */}
      <div className="bg-slate-100 dark:bg-slate-800/50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Our Core Values
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
              The principles that guide how we build our products and serve our
              customers.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {values.map((value, index) => (
                <motion.div
                  key={value.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-slate-900 dark:text-white">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5">
                      {value.icon}
                    </div>
                    {value.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600 dark:text-slate-400">
                    <p className="flex-auto">{value.description}</p>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
