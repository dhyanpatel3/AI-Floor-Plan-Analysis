import axios from "axios";

// Use environment variable for host, or fallback to relative path (proxy)
const BASE_URL = import.meta.env.VITE_API_URL || "";
const API_URL = `${BASE_URL}/api/floorplans/`;

const saveFloorPlan = async (
  file: File,
  analysisResult: any,
  costEstimation: any,
  token: string,
) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("analysisResult", JSON.stringify(analysisResult));
  formData.append("costEstimation", JSON.stringify(costEstimation));

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL, formData, config);
  return response.data;
};

const getUserFloorPlans = async (token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL, config);
  return response.data;
};

const deleteFloorPlan = async (id: string, token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(API_URL + id, config);
  return response.data;
};

const floorPlanService = {
  saveFloorPlan,
  getUserFloorPlans,
  deleteFloorPlan,
};

export default floorPlanService;
