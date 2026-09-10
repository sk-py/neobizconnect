import { dealerApi } from "@/services/axios";
import { DEALER_BASE_URL_POST } from "@/constants/config";
import { EmployeeOption, OnlineLead, OnlineLeadFormData } from "../types";

export const fetchOnlineLeads = async (): Promise<OnlineLead[]> => {
  const res = await dealerApi.get<OnlineLead[]>(`/Neo/Online/Lead/Query`);
  return res.data;
};

export const fetchAssignedToOptions = async (groupId: number): Promise<EmployeeOption[]> => {
  const res = await dealerApi.get<EmployeeOption[]>(`/Employee/Details/By/Authority`, {
    params: { id: groupId },
  });
  return res.data;
};

export const createOnlineLead = async (
  formData: OnlineLeadFormData,
  companyId: number,
): Promise<void> => {
  await dealerApi.post(`${DEALER_BASE_URL_POST}/Neo/Online/Lead/Query`, {
    formJson: [formData],
    id: 0,
    companyid: companyId,
  });
};

export const updateOnlineLead = async (
  leadId: number,
  companyId: number,
  originalFormData: OnlineLeadFormData,
  updates: Partial<OnlineLeadFormData>,
): Promise<void> => {
  const mergedForm = { ...originalFormData, ...updates };
  if (mergedForm.account_owner_id !== undefined) {
    mergedForm.account_owner_id = String(mergedForm.account_owner_id);
  }

  await dealerApi.post(`${DEALER_BASE_URL_POST}/Neo/Online/Lead/Query`, {
    formJson: [mergedForm],
    id: leadId,
    companyid: companyId,
  });
};

export const transferOnlineLead = async (
  leadId: number,
  employeeId: number,
): Promise<void> => {
  await dealerApi.post(`/Neo/Online/Lead/Transfer/To/Lead/Query`, {
    id: leadId,
    employee_id: employeeId,
  });
};