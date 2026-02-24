import React, { useState, useEffect, useContext } from "react";
import { Header } from "../components/Header";
import AuthContext from "../contexts/AuthContext";
import adminService from "../services/adminService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Shield, Trash2, Edit2, Check, X, Search, User } from "lucide-react";

interface AdminDashboardProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  credits: number;
  isAdmin: boolean;
  createdAt: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isDarkMode,
  toggleTheme,
}) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit logic
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCredits, setEditCredits] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    if (!user.isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/dashboard");
      return;
    }

    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      if (user?.token) {
        const data = await adminService.getUsers(user.token);
        setUsers(data);
      }
    } catch (error: any) {
      toast.error("Failed to fetch users");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (user: UserData) => {
    setEditingId(user._id);
    setEditCredits(user.credits);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCredits(0);
  };

  const handleSaveCredits = async (userId: string) => {
    try {
      if (user?.token) {
        await adminService.updateUserCredits(userId, editCredits, user.token);
        toast.success("Credits updated successfully");
        setUsers(
          users.map((u) =>
            u._id === userId ? { ...u, credits: editCredits } : u,
          ),
        );
        setEditingId(null);
      }
    } catch (error) {
      toast.error("Failed to update credits");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This cannot be undone.",
      )
    ) {
      try {
        if (user?.token) {
          await adminService.deleteUser(userId, user.token);
          toast.success("User deleted successfully");
          setUsers(users.filter((u) => u._id !== userId));
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to delete user");
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <div
        className={`min-h-screen p-6 transition-colors duration-300 ${isDarkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Shield className="w-8 h-8 text-indigo-600" />
                Super Admin Dashboard
              </h1>
              <p className="text-slate-500 mt-2">Manage users and credits</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg border ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500"
                    : "bg-white border-slate-200 text-slate-900 focus:border-indigo-500"
                } focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full md:w-64`}
              />
            </div>
          </div>

          <div
            className={`rounded-xl shadow-sm overflow-hidden border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead
                  className={`text-xs uppercase font-semibold ${isDarkMode ? "bg-slate-700/50 text-slate-300" : "bg-slate-50 text-slate-500"}`}
                >
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Credits</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-slate-500"
                      >
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-slate-500"
                      >
                        No users found matching "{searchTerm}"
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr
                        key={u._id}
                        className={`group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{u.name}</div>
                              <div className="text-sm text-slate-500">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.isAdmin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingId === u._id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editCredits}
                                onChange={(e) =>
                                  setEditCredits(parseInt(e.target.value) || 0)
                                }
                                className={`w-20 px-2 py-1 rounded border text-sm ${
                                  isDarkMode
                                    ? "bg-slate-700 border-slate-600 text-white"
                                    : "bg-white border-slate-300 text-slate-900"
                                }`}
                                min="0"
                              />
                            </div>
                          ) : (
                            <div className="font-mono font-medium text-slate-600 dark:text-slate-300">
                              {u.credits}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {editingId === u._id ? (
                              <>
                                <button
                                  onClick={() => handleSaveCredits(u._id)}
                                  className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                                  title="Save"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleEditClick(u)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors group-hover:opacity-100 opacity-0"
                                title="Edit Credits"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {!u.isAdmin && (
                              <button
                                onClick={() => handleDeleteUser(u._id)}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors group-hover:opacity-100 opacity-0"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
