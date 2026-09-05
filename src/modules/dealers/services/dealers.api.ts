import { api } from "@/services/axios";
import { Dealer } from "../types";

export const fetchDealers = async (): Promise<Dealer[]> => {
  const response = await api.get<Dealer[]>(`/Neo/Dealer/User`);
  return response.data;
};