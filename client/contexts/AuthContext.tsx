import { createContext, useState, useEffect, ReactNode } from "react";
import authService from "../services/authService";

interface User {
  _id: string;
  name: string;
  email: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  message: string;
  register: (user: any) => Promise<void>;
  login: (user: any) => Promise<void>;
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

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const reset = () => {
    setIsError(false);
    setIsSuccess(false);
    setIsLoading(false);
    setMessage("");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isError,
        isSuccess,
        message,
        register,
        login,
        logout,
        reset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
