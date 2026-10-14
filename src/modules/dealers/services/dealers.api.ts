import { api } from "@/services/axios";
import { Dealer } from "../types";

export type CreateDealerLoginPayload = {
  dealerId: number;
  cardCode: string;
  username: string;
  password: string;
  status: 0 | 1;
  brandTypes: string[];
};

export const createDealerLogin = async (
  payload: CreateDealerLoginPayload,
): Promise<void> => {
  void payload;
  throw new Error("Create Login API is not connected yet.");
};

export const fetchDealers = async (): Promise<Dealer[]> => {
  const response = await api.get<Dealer[]>(`/Neo/Dealer/User`);
  return response.data;
};