import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./contexts/AuthContext";
import { AnalysisProvider } from "./contexts/AnalysisContext";
import { Header } from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";

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
        <AuthProvider>
          <AnalysisProvider>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
              <Routes>
                <Route
                  path="/"
                  element={
                    <Dashboard
                      isDarkMode={isDarkMode}
                      toggleTheme={toggleTheme}
                    />
                  }
                />
                <Route
                  path="/login"
                  element={
                    <Layout>
                      <Login />
                    </Layout>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <Layout>
                      <Signup />
                    </Layout>
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
