import { BASE_URL } from "@/constants/config";
import { useAuthStore } from "@/store/auth.store";
import axios from "axios";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore().clearSession();
    }
    return Promise.reject(error);
  },
);