import axios from "axios";

// Use environment variable for host, or fallback to relative path (proxy)
const BASE_URL = import.meta.env.VITE_API_URL || "";
const API_URL = `${BASE_URL}/api/auth/`;

// Register user
const register = async (userData: any) => {
  const response = await axios.post(API_URL + "register", userData);

  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data));
  }

  return response.data;
};

// Login user
const login = async (userData: any) => {
  const response = await axios.post(API_URL + "login", userData);

  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data));
  }

  return response.data;
};

// Logout user
const logout = () => {
  localStorage.removeItem("user");
};

// Google Login
const googleLogin = async (credential: string) => {
  const response = await axios.post(API_URL + "google", { credential });

  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data));
  }

  return response.data;
};

// Forgot Password
const forgotPassword = async (email: string) => {
  const response = await axios.post(API_URL + "forgotpassword", { email });
  return response.data;
};

// Reset Password
const resetPassword = async (password: string, token: string) => {
  const response = await axios.put(API_URL + `resetpassword/${token}`, {
    password,
  });

  return response.data;
};

const authService = {
  register,
  logout,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
};

export default authService;
