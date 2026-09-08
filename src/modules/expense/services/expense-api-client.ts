import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const EXPENSE_BASE_URL = "https://dealer-uat.actifyzone.com/crm-uat/Crm/Portal";

export const expenseApi = axios.create({
  baseURL: EXPENSE_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

expenseApi.interceptors.request.use((config) => {
  let token = (useAuthStore.getState().accessToken || "").trim();
  token = token.replace(/^Bearer\s+/i, "").trim();

  if (token) {
    // Fixes "Illegal base64url character" error caused by + being
    // URL-decoded into a space somewhere along the request path.
    const safeToken = token.includes("+") ? token.replace(/\+/g, "%2B") : token;
    config.headers.Authorization = `Bearer ${safeToken}`;
  }
  return config;
});