import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import {
  Moon,
  Sun,
  Settings,
  Download,
  User as UserIcon,
  LogOut,
  LogIn,
  Save,
  Zap,
  Shield,
  Layers,
  LayoutDashboard,
  CreditCard,
} from "lucide-react";
import AuthContext from "../contexts/AuthContext";
import LoginModal from "./LoginModal";

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onOpenSettings?: () => void;
  onDownloadPDF?: () => void;
  onSaveProfile?: () => void;
  isSaving?: boolean;
  isExporting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  toggleTheme,
  onOpenSettings,
  onDownloadPDF,
  onSaveProfile,
  isSaving,
  isExporting,
}) => {
  const authContext = useContext(AuthContext);
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const { user, logout, googleLogin } = authContext || {};
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      if (googleLogin) {
        googleLogin({ access_token: codeResponse.access_token });
      }
    },
    onError: (error) => console.log("Login Failed:", error),
  });

  const onLogout = () => {
    if (logout) {
      logout();
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60 transition-all duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-3 group transition-opacity hover:opacity-90"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200 bg-white">
                <img
                  src="/logo.jpg"
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight leading-none">
                  AI Floor Analyzer
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Construction Estimator
                </span>
              </div>
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Primary Actions Group */}
            <div className="flex items-center gap-2 mr-1">
              {user && (
                <Link
                  to="/pricing"
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800 group mr-2"
                  title="Buy More Credits"
                >
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div className="flex flex-col leading-none pr-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      Credits
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {user.credits || 0}
                    </span>
                  </div>
                </Link>
              )}

              {onSaveProfile && user && (
                <button
                  onClick={onSaveProfile}
                  disabled={isSaving}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                  aria-label="Save to Profile"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Saving..." : "Save"}</span>
                </button>
              )}

              {onDownloadPDF && (
                <button
                  onClick={onDownloadPDF}
                  disabled={isExporting}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                  aria-label="Download Report"
                >
                  <Download
                    className={`w-4 h-4 ${isExporting ? "animate-bounce" : ""}`}
                  />
                  <span>{isExporting ? "Exporting..." : "Export"}</span>
                </button>
              )}
            </div>

            {/* Divider */}
            {/* <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1"></div> */}

            {/* Utility Icons */}
            <div className="flex items-center gap-2">
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all duration-200 group"
                  aria-label="Settings"
                  title="Settings"
                >
                  <Settings className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                </button>
              )}

              <button
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                aria-label="Toggle Theme"
                title={
                  isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-amber-400 transition-transform hover:rotate-90" />
                ) : (
                  <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
                )}
              </button>
            </div>

            {/* User Profile / Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                {/* Admin Link */}
                {user.isAdmin && (
                  <Link
                    to="/admin"
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 dark:hover:text-purple-300 transition-all duration-200"
                    title="Admin Dashboard"
                  >
                    <Shield className="w-5 h-5" />
                  </Link>
                )}

                {/* Dashboard Link */}
                <Link
                  to="/saved-plans"
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 transition-all duration-200"
                  title="Saved Plans"
                >
                  <LayoutDashboard className="w-5 h-5" />
                </Link>

                {/* Profile Link */}
                <Link
                  to="/profile"
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300 transition-all duration-200"
                  title="Profile"
                >
                  <UserIcon className="w-5 h-5" />
                </Link>

                <button
                  onClick={onLogout}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-300 transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleGoogleLogin()}
                className="ml-2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold shadow-lg shadow-slate-900/20 dark:shadow-white/10 transition-all hover:scale-105 active:scale-95 hover:shadow-xl"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {/* LoginModal removed or kept for other purposes if needed, but not triggered by Sign In button anymore */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </header>
  );
};
