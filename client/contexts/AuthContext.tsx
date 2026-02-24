import { createContext, useState, useEffect, ReactNode } from "react";
import authService from "../services/authService";
import WelcomeModal from "../components/WelcomeModal";

interface User {
  _id: string;
  name: string;
  email: string;
  credits: number;
  isAdmin: boolean;
  token: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyLogo?: string;
}

interface AuthContextType {
  user: User | null;
  updateCredits: (credits: number) => void;
  buyCredits: (amount: number) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  message: string;
  register: (user: any) => Promise<void>;
  login: (user: any) => Promise<void>;
  googleLogin: (data: {
    credential?: string;
    access_token?: string;
  }) => Promise<void>;
  logout: () => void;
  reset: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const data = await authService.register(userData);
      setUser(data);
      if (data.isNewUser) {
        setShowWelcome(true);
      }
      setIsSuccess(true);
    } catch (error: any) {
      setIsError(true);
      setMessage(
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
          error.message ||
          error.toString(),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: any) => {
    setIsLoading(true);
    try {
      const data = await authService.login(userData);
      setUser(data);
      setIsSuccess(true);
    } catch (error: any) {
      setIsError(true);
      setMessage(
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
          error.message ||
          error.toString(),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (authData: {
    credential?: string;
    access_token?: string;
  }) => {
    setIsLoading(true);
    try {
      const data = await authService.googleLogin(authData);
      setUser(data);
      setIsSuccess(true);
      if (data.isNewUser) {
        setShowWelcome(true);
      }
    } catch (error: any) {
      setIsError(true);
      setMessage(
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
          error.message ||
          error.toString(),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateCredits = (credits: number) => {
    if (user) {
      const updatedUser = { ...user, credits };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const buyCredits = async (amount: number) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updatedUser = await authService.addCredits(amount, user.token);
      setUser(updatedUser);
      setIsSuccess(true);
      setMessage(`Successfully added ${amount} credits!`);
    } catch (error: any) {
      setIsError(true);
      setMessage(
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
          error.message ||
          error.toString(),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsError(false);
    setIsSuccess(false);
    setIsLoading(false);
    setMessage("");
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updatedUser = await authService.updateDetails(data, user.token);
      setUser(updatedUser);
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Update profile failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        updateCredits,
        updateProfile,
        isLoading,
        isError,
        isSuccess,
        message,
        register,
        login,
        googleLogin,
        logout,
        reset,
      }}
    >
      {children}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
      />
    </AuthContext.Provider>
  );
};

export default AuthContext;
