import { api } from "@/services/axios";
import { DealerProfileResponse } from "../types";

export const fetchDealerProfile = async (
  groupCompanyName: string,
): Promise<DealerProfileResponse> => {
  const res = await api.get(`/${groupCompanyName}/Dealer/User/profile`);
  return res.data;
};

export const changeDealerPassword = async (
  oldPassword: string,
  newPassword: string,
): Promise<void> => {
  await api.post("/Employee/Details/Password/Changes", {
    old_password: oldPassword,
    new_password: newPassword,
  });
};