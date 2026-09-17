import { api } from "@/services/axios";
import { SalesManager } from "../types";

export const fetchSalesManagers = async (): Promise<SalesManager[]> => {
  const response = await api.get<SalesManager[]>(`/Neo/Sales/User`);
  return response.data;
};