import axios from "axios";
import { ProjectSettings } from "../types";

const API_URL = "/api/settings";

const fetchSettings = async (token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(API_URL, config);
  return response.data;
};

const saveSettings = async (
  token: string,
  data: {
    projectSettings: ProjectSettings;
    customRates: Record<string, number>;
    customQuantities: Record<string, number>;
  },
) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(API_URL, data, config);
  return response.data;
};

const settingsService = {
  fetchSettings,
  saveSettings,
};

export default settingsService;
