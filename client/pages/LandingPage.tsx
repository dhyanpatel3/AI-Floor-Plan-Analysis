import React, { useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload,
  BarChart2,
  Calculator,
  Layout,
  ArrowRight,
  CheckCircle,
  FileText,
  Layers,
  Zap,
  Twitter,
  Linkedin,
  Instagram,
} from "lucide-react";
import { Header } from "../components/Header";
import AuthContext from "../contexts/AuthContext";
import LoginModal from "../components/LoginModal";

interface LandingPageProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

export default function LandingPage({
  isDarkMode,
  toggleTheme,
}: LandingPageProps) {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (authContext?.user) {
      navigate("/dashboard");
    }
  }, [authContext?.user, navigate]);

  const handleUploadClick = () => {
    // Navigate to dashboard if logged in, otherwise open login modal
    if (authContext?.user) {
      navigate("/dashboard");
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 overflow-x-hidden">
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl accent-blue-500" />
        </div>

        <div className="container mx-auto px-6 md:px-12 lg:px-24 xl:px-32 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left Content */}
            <motion.div
              className="lg:w-1/2 text-center lg:text-left"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.h1
                variants={itemVariants}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 dark:text-white leading-tight"
              >
                AI Construction <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  Estimator
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                Upload your floor plan to instantly generate material
                quantities, cost estimates, and detailed room-by-room analysis.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <button
                  onClick={handleUploadClick}
                  className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload Plan
                </button>
                <button
                  onClick={() => navigate("/demo")} // Assuming a demo route or just placeholder
                  className="px-8 py-4 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  View Demo
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>

            {/* Right Image/Visual */}
            <motion.div
              className="lg:w-1/2 w-full relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {/* Abstract Floating UI Representation */}
              <div className="relative rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 p-6 shadow-2xl">
                {/* Simulated Floor Plan Chart */}
                <div className="aspect-[4/3] rounded-lg bg-slate-50 dark:bg-slate-900 relative overflow-hidden border border-slate-200 dark:border-slate-700">
                  {/* Grid Background */}
                  <div
                    className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                    style={{
                      backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)`,
                      backgroundSize: "20px 20px",
                    }}
                  />

                  {/* Floor Plan SVG */}
                  <svg
                    className="absolute inset-0 w-full h-full p-8 text-slate-800 dark:text-slate-200"
                    viewBox="0 0 400 300"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Walls */}
                    <path
                      d="M50 50 H 350 V 250 H 50 V 50 Z"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-90"
                    />
                    <path
                      d="M50 150 H 200 V 250"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-90"
                    />
                    <path
                      d="M200 50 V 150 H 350"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-90"
                    />

                    {/* Doors */}
                    <path
                      d="M110 250 Q 110 220 140 220"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    <path d="M110 250 L 140 220" stroke="transparent" />
                    <rect
                      x="110"
                      y="248"
                      width="30"
                      height="4"
                      fill="white"
                      className="dark:fill-slate-900"
                    />

                    {/* Windows */}
                    <rect
                      x="100"
                      y="48"
                      width="40"
                      height="4"
                      fill="white"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      className="dark:fill-slate-900"
                    />
                    <rect
                      x="250"
                      y="48"
                      width="40"
                      height="4"
                      fill="white"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      className="dark:fill-slate-900"
                    />
                    <rect
                      x="348"
                      y="100"
                      width="4"
                      height="40"
                      fill="white"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      className="dark:fill-slate-900"
                    />

                    {/* Room Labels */}
                    <text
                      x="125"
                      y="100"
                      fontFamily="sans-serif"
                      fontSize="14"
                      fill="currentColor"
                      opacity="0.6"
                      textAnchor="middle"
                    >
                      Living Room
                    </text>
                    <text
                      x="275"
                      y="100"
                      fontFamily="sans-serif"
                      fontSize="14"
                      fill="currentColor"
                      opacity="0.6"
                      textAnchor="middle"
                    >
                      Kitchen
                    </text>
                    <text
                      x="125"
                      y="200"
                      fontFamily="sans-serif"
                      fontSize="14"
                      fill="currentColor"
                      opacity="0.6"
                      textAnchor="middle"
                    >
                      Master Bedroom
                    </text>
                    <text
                      x="275"
                      y="200"
                      fontFamily="sans-serif"
                      fontSize="14"
                      fill="currentColor"
                      opacity="0.6"
                      textAnchor="middle"
                    >
                      Garage
                    </text>

                    {/* Dimensions */}
                    <text
                      x="200"
                      y="35"
                      fontFamily="monospace"
                      fontSize="10"
                      fill="#6366f1"
                      textAnchor="middle"
                    >
                      40' 0"
                    </text>
                    <text
                      x="365"
                      y="150"
                      fontFamily="monospace"
                      fontSize="10"
                      fill="#6366f1"
                      textAnchor="middle"
                      transform="rotate(90, 365, 150)"
                    >
                      30' 0"
                    </text>
                  </svg>

                  {/* Scanned Effect */}
                  <motion.div
                    className="absolute inset-0 bg-blue-500/10 border-b-2 border-blue-500/50"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{ height: "10%" }}
                  />

                  {/* Floating Cards simulating analysis - Positioned strategically */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      ease: "easeInOut",
                    }}
                    className="absolute top-8 right-8 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 flex gap-3 items-center"
                  >
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Calculator className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Total Cost
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        $42,500
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 5,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                    className="absolute bottom-8 left-8 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 flex gap-3 items-center"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Materials
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        12 Items
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white/50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6 md:px-12 lg:px-24 xl:px-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Powerful AI Floor Analyzer
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Generate detailed estimates and material calculations in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              }
              title="AI-Powered Analysis"
              description="Advanced AI analyzes your floor plan to extract all important details."
            />
            <FeatureCard
              icon={
                <Calculator className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              }
              title="Cost Estimation"
              description="Get instant cost estimate based on accurate material and labor calculations."
            />
            <FeatureCard
              icon={
                <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              }
              title="Material Calculation"
              description="Detailed breakdown of materials needed with accurate quantities for each room."
            />
            <FeatureCard
              icon={
                <Layout className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              }
              title="Room-by-Room Breakdown"
              description="Receive a detailed analysis of every room including dimensions, materials, & costs."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-12 lg:px-24 xl:px-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-center gap-3">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <StepCard
              number="01"
              icon={<Upload className="w-8 h-8 text-blue-600" />}
              title="Upload Floor Plan"
              description="Simply upload your floor plan image (JPG, PNG, PDF)"
            />
            <StepCard
              number="02"
              icon={<Zap className="w-8 h-8 text-blue-600" />}
              title="AI Analyzes Plan"
              description="Our AI extracts dimensions, materials, and more with high accuracy."
            />
            <StepCard
              number="03"
              icon={<FileText className="w-8 h-8 text-blue-600" />}
              title="Get Detailed Estimates"
              description="View instant cost estimates and material quantities."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="container mx-auto px-6 md:px-12 lg:px-24 xl:px-32">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  AI
                </div>
                <span className="text-xl font-bold text-white">Estimator</span>
              </div>
              <p className="text-sm text-slate-400">
                Advanced AI-powered floor plan analysis and cost estimation for
                construction professionals.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/features"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/demo"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/about-us"
                    className="hover:text-blue-400 transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/careers"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/privacy-policy"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms-of-service"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cookie-policy"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              © 2026 AI Floor Analyzer. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer text-slate-300 hover:text-white"
              >
                <span className="sr-only">Twitter</span>
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer text-slate-300 hover:text-white"
              >
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer text-slate-300 hover:text-white"
              >
                <span className="sr-only">Instagram</span>
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
      whileHover={{ y: -5 }}
    >
      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center relative overflow-hidden group hover:bg-white dark:hover:bg-slate-800 transition-colors duration-300">
      <div className="absolute top-4 right-4 text-4xl font-bold text-slate-100 dark:text-slate-700 pointer-events-none select-none group-hover:scale-110 transition-transform">
        {number}
      </div>
      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
        {description}
      </p>
    </div>
  );
}
