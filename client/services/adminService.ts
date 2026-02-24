import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "";
const API_URL = `${BASE_URL}/api/admin/`;

// Get all users
const getUsers = async (token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(`${API_URL}users`, config);

  return response.data;
};

// Update user credits
const updateUserCredits = async (
  id: string,
  credits: number,
  token: string,
) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(
    `${API_URL}users/${id}/credits`,
    { credits },
    config,
  );

  return response.data;
};

// Delete user
const deleteUser = async (id: string, token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(`${API_URL}users/${id}`, config);

  return response.data;
};

const adminService = {
  getUsers,
  updateUserCredits,
  deleteUser,
};

export default adminService;
