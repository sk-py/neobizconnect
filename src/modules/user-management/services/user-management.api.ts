import { api } from "@/services/axios";
import { CreateUserPayload, DealerEmployee, UserCountSummary } from "../types";

export const fetchUsersList = async (): Promise<DealerEmployee[]> => {
  const response = await api.get<DealerEmployee[]>(
    `/Dealer/Employee/Details/By/Authority`,
  );
  return response.data;
};

export const fetchUsersCount = async (): Promise<UserCountSummary> => {
  const response = await api.get<UserCountSummary>(
    `/Dealer/Employee/Details/By/Authority/Count`,
  );
  return response.data;
};
export const createUser = async (
  payload: CreateUserPayload,
): Promise<void> => {
  await api.post(`/Dealer/Employee/Create`, payload);
};