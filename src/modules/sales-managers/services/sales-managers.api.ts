import { api } from "@/services/axios";
import { SalesManager } from "../types";

export type SalesManagerLoginPayload = {
  userCode: string;
  username: string;
  password: string;
  status: 0 | 1;
};

export const saveSalesManagerLogin = async (
  payload: SalesManagerLoginPayload,
): Promise<void> => {
  await api.post(`/Add/Neo/Sales/User`, {
    user_code: payload.userCode,
    username: payload.username,
    password: payload.password,
    status: String(payload.status),
  });
};

export const fetchSalesManagers = async (): Promise<SalesManager[]> => {
  const response = await api.get<SalesManager[]>(`/Neo/Sales/User`);
  return response.data;
};