import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import AuthContext from "../contexts/AuthContext";

function Login() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }

  const { user, isLoading, isError, isSuccess, message, googleLogin, reset } =
    authContext;

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess || user) {
      navigate("/");
    }

    return () => {
      reset();
    };
  }, [user, isError, isSuccess, message, navigate, reset]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 mx-4 transition-all duration-300">
        <h2 className="text-3xl font-bold mb-8 text-center text-slate-800 dark:text-white tracking-tight">
          Welcome
        </h2>

        <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
          Sign in to access your dashboard
        </p>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                googleLogin(credentialResponse.credential);
              }
            }}
            onError={() => {
              toast.error("Google Login Failed");
            }}
            useOneTap
            theme="filled_blue"
            size="large"
            width="300"
          />
        </div>
      </div>
    </div>
  );
}

export default Login;
