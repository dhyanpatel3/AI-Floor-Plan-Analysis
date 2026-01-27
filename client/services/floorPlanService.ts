import axios from "axios";

const API_URL = "/api/floorplans/";

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
      "Content-Type": "multipart/form-data",
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
