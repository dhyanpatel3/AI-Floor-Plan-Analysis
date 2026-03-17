import React, { useContext, useState, useEffect } from "react";
import AuthContext from "../contexts/AuthContext";
import {
  ArrowLeft,
  User,
  Mail,
  Zap,
  Building,
  MapPin,
  Phone,
  Upload,
  Save,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Profile() {
  const navigate = useNavigate();
  // @ts-ignore
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }

  const { user, updateProfile } = authContext;

  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    companyLogo: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        companyName: user.companyName || "",
        companyAddress: user.companyAddress || "",
        companyPhone: user.companyPhone || "",
        companyLogo: user.companyLogo || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        // 500KB limit
        toast.error("Image size should be less than 500KB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, companyLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (updateProfile) {
        await updateProfile(formData);
        toast.success("Profile updated successfully");
        setIsEditing(false);
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto mt-10 p-5 text-center">
        <h2 className="text-2xl font-bold dark:text-white mb-4">
          Please login to view profile
        </h2>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 md:px-12 py-10 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold dark:text-white">Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Info Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-10 dark:opacity-20 z-0"></div>

          <div className="p-8 relative z-10 pt-16">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-slate-700 flex items-center justify-center mb-4 ring-4 ring-white dark:ring-slate-800 shadow-md text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {user.name}
              </h2>
              <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-600 flex items-center justify-center mr-4 text-blue-600 dark:text-blue-400">
                  <User size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Account Name
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {user.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-slate-600 flex items-center justify-center mr-4 text-indigo-600 dark:text-indigo-400">
                  <Mail size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Email Address
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-slate-600 flex items-center justify-center mr-4 text-amber-600 dark:text-amber-400">
                  <Zap size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Available Credits
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {user.credits} Credits
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={() => navigate("/saved-plans")}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
              >
                My Projects
              </button>
              <button
                onClick={() => navigate("/pricing")}
                className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-medium rounded-xl transition-colors"
              >
                Buy Credits
              </button>
            </div>
          </div>
        </div>

        {/* Company Details Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Company Details
            </h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>

          <div className="p-8">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Use these details to customize your exported PDF reports with your
              company branding.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Company Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600">
                    {formData.companyLogo ? (
                      <img
                        src={formData.companyLogo}
                        alt="Company Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building className="text-slate-400 w-8 h-8" />
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex-1">
                      <label className="cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 w-fit">
                        <Upload size={16} />
                        Upload Logo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                      </label>
                      <p className="text-xs text-slate-500 mt-2">
                        Recommended: Square PNG, max 500KB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Company Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="pl-10 w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="pl-10 w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                    placeholder="Enter company address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="pl-10 w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
