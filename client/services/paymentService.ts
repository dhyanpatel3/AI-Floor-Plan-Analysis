import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "";
const API_URL = `${BASE_URL}/api/payment/`;

const createOrder = async (credits: number, token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(
    API_URL + "create-order",
    { credits },
    config,
  );
  return response.data;
};

const verifyPayment = async (paymentData: any, token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(API_URL + "verify", paymentData, config);
  return response.data;
};

const paymentService = {
  createOrder,
  verifyPayment,
};

export default paymentService;
