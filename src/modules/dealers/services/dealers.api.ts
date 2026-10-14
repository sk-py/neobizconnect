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
  await api.post(`/Add/Neo/Dealer/User`, {
    user_code: payload.cardCode,
    password: payload.password,
    username: payload.username,
    status: String(payload.status),
    brand_type: payload.brandTypes,
  });
};

// Same endpoint as create: the backend updates the login when it already exists.
export const updateDealerLogin = async (
  payload: CreateDealerLoginPayload,
): Promise<void> => {
  await api.post(`/Add/Neo/Dealer/User`, {
    user_code: payload.cardCode,
    password: payload.password,
    username: payload.username,
    status: String(payload.status),
    brand_type: payload.brandTypes,
  });
};

export const fetchDealers = async (): Promise<Dealer[]> => {
  const response = await api.get<Dealer[]>(`/Neo/Dealer/User`);
  return response.data;
};