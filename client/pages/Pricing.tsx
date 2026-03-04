import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  Shield,
  Users,
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle,
} from "lucide-react";
import { Header } from "../components/Header";
import AuthContext from "../contexts/AuthContext";
import paymentService from "../services/paymentService";
import { motion, AnimatePresence } from "framer-motion";

interface PricingProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Pricing: React.FC<PricingProps> = ({ isDarkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const { user, updateCredits } = useContext(AuthContext)!;
  const [creditAmount, setCreditAmount] = useState<number>(1);
  const PRICE_PER_CREDIT = 500;
  const [showSuccess, setShowSuccess] = useState(false);
  const [addedCredits, setAddedCredits] = useState(0);

  const handleIncrement = () => {
    setCreditAmount((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setCreditAmount((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      // Check if Razorpay is already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const res = await loadRazorpay();

    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    try {
      const order = await paymentService.createOrder(creditAmount, user.token);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_placeholder",
        amount: order.amount,
        currency: order.currency,
        name: "AI Floor Analyzer",
        description: `Purchase ${creditAmount} Credits`,
        image:
          user.companyLogo ||
          "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        order_id: order.id,
        handler: async function (response: any) {
          const data = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            credits: creditAmount,
          };

          try {
            const result = await paymentService.verifyPayment(data, user.token);
            if (result.success) {
              updateCredits(result.credits);
              setAddedCredits(creditAmount);
              setShowSuccess(true);
              setTimeout(() => {
                setShowSuccess(false);
                navigate("/dashboard");
              }, 3000);
            }
          } catch (error) {
            console.error(error);
            alert("Payment verification failed");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.companyPhone || "9999999999",
        },
        notes: {
          address: user.companyAddress || "Corporate Office",
        },
        theme: {
          color: isDarkMode ? "#6366f1" : "#4f46e5",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error(error);
      alert("Something went wrong with payment initiation");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-3xl"></div>
      </div>

      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10 min-h-[calc(100vh-100px)] flex flex-col justify-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Text & Features */}
          <div className="text-left space-y-8">
            <div>
              <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold tracking-wide uppercase mb-4">
                Simple Pricing
              </span>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl tracking-tight mb-4">
                Purchase Credits <br />
                <span className="text-indigo-600 dark:text-indigo-400">
                  Instantly
                </span>
              </h2>
              <p className="max-w-xl text-lg text-slate-500 dark:text-slate-400">
                No subscriptions. No hidden fees. Pay only for what you use.
                <br />
                <span className="font-medium text-slate-900 dark:text-white mt-2 block">
                  1 Credit = 1 Full Project Analysis
                </span>
              </p>
            </div>

            {/* Feature Grid - Compact */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Secure
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Stripe protected
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Instant
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Immediate access
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Team Ready
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Share with team
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Calculator Card */}
          <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 backdrop-blur-sm relative transform transition-all hover:scale-[1.01]">
            <div className="p-6 md:p-8">
              <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-6">
                Configure Your Pack
              </h3>

              {/* Counter Section */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 mb-6 border border-slate-100 dark:border-slate-700">
                <button
                  onClick={handleDecrement}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-600 dark:text-slate-300 transition-all hover:scale-105 active:scale-95"
                  disabled={creditAmount <= 1}
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min="1"
                    value={creditAmount || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        // @ts-ignore - temporary allow empty for typing
                        setCreditAmount("");
                        return;
                      }
                      const num = parseInt(val);
                      if (!isNaN(num) && num > 0) setCreditAmount(num);
                    }}
                    onBlur={() => {
                      // Reset to 1 if left empty or 0
                      if (!creditAmount || creditAmount < 1) setCreditAmount(1);
                    }}
                    className="w-20 text-center text-4xl font-black bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Credits
                  </span>
                </div>

                <button
                  onClick={handleIncrement}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/30 text-white hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-sm">
                  <span>Price per credit</span>
                  <span>₹{PRICE_PER_CREDIT}</span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    Total Pay
                  </span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                    ₹{creditAmount * PRICE_PER_CREDIT}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
              >
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center border border-slate-100 dark:border-slate-700"
            >
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Payment Successful!
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                You have added {addedCredits} credits to your account.
              </p>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3 }}
                  className="h-full bg-green-500"
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                Redirecting to dashboard...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Pricing;
