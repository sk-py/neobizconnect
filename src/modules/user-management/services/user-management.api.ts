import { api } from "@/services/axios";
import {
  AuthorityOption,
  CreateUserPayload,
  DealerEmployee,
  UpdateUserPayload,
  UserCountSummary,
} from "../types";

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
export const fetchAuthorities = async (): Promise<AuthorityOption[]> => {
  const response = await api.get<any[]>(`/AUTHORITY_ENDPOINT_HERE`);
  return (response.data ?? [])
    .map((a) => ({
      label: String(a.authority_name ?? a.name ?? a.label ?? ""),
      value: Number(a.id ?? a.authority_id ?? a.authorityid ?? a.value),
    }))
    .filter((a) => a.label && !Number.isNaN(a.value));
};

export const updateUser = async (
  payload: UpdateUserPayload,
): Promise<void> => {
    const { existing } = payload;
    await api.post(`/Update/Neo/Query-Admin-SuperAdmin/User`, {
    id: payload.id,
    employee_code: existing.employee_code ?? "0",
    firstname: payload.firstName,
    lastname: payload.lastName ?? "",
    email: payload.email,
    number: payload.mobile ?? "",
    department: existing.department ?? "",
    designation: existing.designation ?? "",
    region: existing.region ?? "",
    territory: existing.territory ?? "",
    zone: existing.zone ?? "",
    city: existing.city ?? "",
    state: existing.state ?? "",
    country: existing.country ?? "",
    pin_code: existing.pin_code ?? "",
    account_password: payload.password,
    lock_status: existing.lock_status,
    login_status: existing.login_status,
    authorityid: payload.authorityId,
    companyid: existing.companyid,
    groupid: existing.groupid,
    locationid: existing.locationid,
    branchid: existing.branchid,
    login_otp: null,
  });
};

export const createUser = async (
  payload: CreateUserPayload,
): Promise<void> => {
    await api.post(`/Add/Neo/Query-Admin-SuperAdmin/User`, {
    first_name: payload.firstName,
    last_name: payload.lastName ?? "",
    email: payload.email,
    password: payload.password,
    mobile_number: payload.mobile ?? "",
    authority_id: String(payload.authorityId),
  });
};