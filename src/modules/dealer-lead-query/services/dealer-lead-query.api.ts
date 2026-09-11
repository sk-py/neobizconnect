import { api } from "@/services/axios";
import { EmployeeOption, LeadFormData, LeadQuery } from "../types";

export const fetchLeadQueries = async (): Promise<LeadQuery[]> => {
  const res = await api.get<LeadQuery[]>("/Neo/Lead/Query");
  return res.data;
};

export const fetchAssignedToOptions = async (groupId: number): Promise<EmployeeOption[]> => {
  const res = await api.get<EmployeeOption[]>("/Employee/Details/By/Authority", {
    params: { id: groupId },
  });
  return res.data;
};

export const createLeadQuery = async (
  formData: LeadFormData,
  companyId: number,
): Promise<void> => {
  await api.post("/Neo/Lead/Query", {
    formJson: [formData],
    id: 0,
    companyid: companyId,
  });
};

export const updateLeadQuery = async (
  leadId: number,
  companyId: number,
  originalFormData: LeadFormData,
  updates: Partial<LeadFormData>,
): Promise<void> => {
  const mergedForm = {
    ...originalFormData,
    ...updates,
    account_owner_id: String(updates.account_owner_id ?? originalFormData.account_owner_id),
  };

  await api.post("/Neo/Lead/Query", {
    formJson: [mergedForm],
    id: leadId,
    companyid: companyId,
  });
};