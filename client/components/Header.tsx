import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const { user, logout } = authContext || {};
  const navigate = useNavigate();

  const onLogout = () => {
    if (logout) {
      logout();
      navigate("/");
    }
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <a href="/" className="block hover:opacity-80 transition-opacity">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
                AI-Floor-Plan-Analysis
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider -mt-1">
                Construction Estimator
              </p>
            </div>
          </a>
        </div>

        <div className="flex items-center space-x-2">
          {user && (
            <Link
              to="/pricing"
              className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition-colors flex items-center gap-1.5 mr-2 border border-indigo-200 dark:border-indigo-800"
              title="Buy More Credits"
            >
              <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
              <span className="text-sm font-bold">{user.credits || 0}</span>
              <span className="text-[10px] uppercase font-bold tracking-wide hidden sm:inline opacity-70">
                Credits
              </span>
            </Link>
          )}

          {onSaveProfile && user && (
            <button
              onClick={onSaveProfile}
              disabled={isSaving}
              className="px-4 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-2 mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save to Profile"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                {isSaving ? "Saving..." : "Save"}
              </span>
            </button>
          )}

          {onDownloadPDF && (
            <button
              onClick={onDownloadPDF}
              disabled={isExporting}
              className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2 mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Download Report"
            >
              <Download
                className={`w-4 h-4 ${isExporting ? "animate-bounce" : ""}`}
              />
              <span className="text-sm font-medium hidden sm:inline">
                {isExporting ? "Exporting..." : "Export PDF"}
              </span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2"
              aria-label="Open Settings"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Toggle Theme"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {user ? (
            <>
              <Link
                to="/profile"
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Profile"
                title="Profile"
              >
                <UserIcon className="w-5 h-5" />
              </Link>
              <button
                onClick={onLogout}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 relative group"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                Sign In
              </span>
            </button>
          )}
        </div>
      </div>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </header>
  );
};
