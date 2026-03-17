import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./contexts/AuthContext";
import { AnalysisProvider } from "./contexts/AnalysisContext";
import { Header } from "./components/Header";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile.tsx";
import SavedPlans from "./pages/SavedPlans.tsx";
import AdminDashboard from "./pages/AdminDashboard";

import Features from "./pages/Features";
import Demo from "./pages/Demo";
import AboutUs from "./pages/AboutUs";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Layout wrapper component for pages that don't have their own specific header
  const Layout = ({ children }: { children: React.ReactNode }) => (
    <>
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      {children}
    </>
  );

  return (
    <>
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <AnalysisProvider>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
              <Routes>
                <Route
                  path="/"
                  element={
                    <LandingPage
                      isDarkMode={isDarkMode}
                      toggleTheme={toggleTheme}
                    />
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <Dashboard
                      isDarkMode={isDarkMode}
                      toggleTheme={toggleTheme}
                    />
                  }
                />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route
                  path="/pricing"
                  element={
                    <Pricing
                      isDarkMode={isDarkMode}
                      toggleTheme={toggleTheme}
                    />
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <Layout>
                      <Profile />
                    </Layout>
                  }
                />
                <Route
                  path="/saved-plans"
                  element={
                    <Layout>
                      <SavedPlans />
                    </Layout>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminDashboard
                      isDarkMode={isDarkMode}
                      toggleTheme={toggleTheme}
                    />
                  }
                />

                <Route
                  path="/features"
                  element={
                    <Layout>
                      <Features />
                    </Layout>
                  }
                />
                <Route
                  path="/demo"
                  element={
                    <Layout>
                      <Demo />
                    </Layout>
                  }
                />
                <Route
                  path="/about-us"
                  element={
                    <Layout>
                      <AboutUs />
                    </Layout>
                  }
                />
                <Route
                  path="/careers"
                  element={
                    <Layout>
                      <Careers />
                    </Layout>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <Layout>
                      <Contact />
                    </Layout>
                  }
                />
                <Route
                  path="/privacy-policy"
                  element={
                    <Layout>
                      <PrivacyPolicy />
                    </Layout>
                  }
                />
                <Route
                  path="/terms-of-service"
                  element={
                    <Layout>
                      <TermsOfService />
                    </Layout>
                  }
                />
                <Route
                  path="/cookie-policy"
                  element={
                    <Layout>
                      <CookiePolicy />
                    </Layout>
                  }
                />
              </Routes>
            </div>
          </AnalysisProvider>
        </AuthProvider>
      </Router>
      <ToastContainer aria-label="Toast notifications" />
    </>
  );
}

export default App;
