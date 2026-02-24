import React, { useEffect, useState } from "react";
import { Gift, X } from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-sm transform overflow-hidden rounded-3xl bg-white dark:bg-slate-800 p-6 text-center shadow-2xl transition-all border border-indigo-100 dark:border-indigo-900">
        {/* Confetti Effect (CSS only for simplicity) */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            <div className="absolute top-10 right-1/4 w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="absolute bottom-10 left-1/3 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute -top-4 left-1/2 w-4 h-4 bg-yellow-400 rotate-45 animate-spin"></div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 ring-8 ring-indigo-50 dark:ring-indigo-900/10">
          <Gift className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
        </div>

        {/* Text */}
        <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
          Welcome Aboard!
        </h3>
        <p className="mb-6 text-slate-500 dark:text-slate-400">
          We're excited to have you. Here's a little gift to get you started:
        </p>

        {/* Reward Box */}
        <div className="mb-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-[2px]">
          <div className="rounded-[10px] bg-white dark:bg-slate-800 p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              You Received
            </span>
            <span className="mt-1 block text-3xl font-black text-slate-900 dark:text-white">
              5 Free Credits
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 hover:-translate-y-0.5"
        >
          Start Estimating
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
