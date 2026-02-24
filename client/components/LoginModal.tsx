import React, { useContext } from "react";
import ReactDOM from "react-dom";
import { GoogleLogin } from "@react-oauth/google";
import { X, Building2 } from "lucide-react";
import { toast } from "react-toastify";
import AuthContext from "../contexts/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const authContext = useContext(AuthContext);

  if (!isOpen) return null;

  if (!authContext) {
    console.error("AuthContext is missing");
    return null;
  }

  const { googleLogin } = authContext;

  const handleGoogleSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      googleLogin({ credential: credentialResponse.credential });
      onClose();
    }
  };

  const handleGoogleError = () => {
    toast.error("Google Login Failed");
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 flex flex-col items-center animate-scale-up border border-slate-100 dark:border-slate-700 mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl">
          <Building2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-serif text-center">
          AI-Floor-Plan-Analysis
        </h2>

        <p className="text-slate-500 dark:text-slate-400 text-center mb-8 text-sm">
          Sign in to analyze your floor plans with AI
        </p>

        <div className="w-full flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            type="standard"
            theme="outline"
            size="large"
            shape="rectangular"
            width="300"
          />
        </div>

        <p className="text-xs text-center text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
          By signing in, you agree to our Terms of Service and Privacy Policy.
          Secure access powered by Google.
        </p>
      </div>
    </div>,
    document.body,
  );
};

export default LoginModal;
