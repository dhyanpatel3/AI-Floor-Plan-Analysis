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
} from "lucide-react";
import AuthContext from "../contexts/AuthContext";

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onOpenSettings?: () => void;
  onDownloadPDF?: () => void;
  onSaveProfile?: () => void;
  isSaving?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  toggleTheme,
  onOpenSettings,
  onDownloadPDF,
  onSaveProfile,
  isSaving,
}) => {
  const authContext = useContext(AuthContext);
  const { user, logout } = authContext || {};
  const navigate = useNavigate();

  const onLogout = () => {
    if (logout) {
      logout();
      navigate("/login");
    }
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
                AI-Floor-Plan-Analysis
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider -mt-1">
                Construction Estimator
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
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
              className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2 mr-2"
              aria-label="Download Report"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                Export PDF
              </span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2"
              aria-label="Open Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {user ? (
            <>
              <Link
                to="/profile"
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Profile"
              >
                <UserIcon className="w-5 h-5" />
              </Link>
              <button
                onClick={onLogout}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">
                  Login
                </span>
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2"
              >
                <span className="text-sm font-medium hidden sm:inline">
                  Sign Up
                </span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
