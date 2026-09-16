import axios from "axios";
import { BASE_URL } from "@/constants/config";
import { useAuthStore } from "@/store/auth.store";
import {
  EmployeeOption,
  OnlineLead,
  OnlineLeadFormData,
} from "../types";

const DEALER_BASE_URL = BASE_URL.replace(
  "crm-uat.actifyzone.com",
  "dealer-uat.actifyzone.com"
);

const DEALER_POST_BASE_URL = DEALER_BASE_URL.replace(
  "/Crm/Portal",
  "//Crm/Portal"
);

const dealerHeaders = () => {
  const raw = (useAuthStore.getState().accessToken || "")
    .replace(/^Bearer\s+/i, "")
    .trim();

  const safe = raw.includes("+")
    ? raw.replace(/\+/g, "%2B")
    : raw;

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${safe}`,
  };
};

export const fetchOnlineLeads = async (): Promise<
  OnlineLead[]
> => {
  const res = await axios.get<OnlineLead[]>(
    `${DEALER_BASE_URL}/Neo/Online/Lead/Query`,
    {
      headers: dealerHeaders(),
    }
  );

  return res.data;
};

export const fetchAssignedToOptions = async (
  groupId: number
): Promise<EmployeeOption[]> => {
  const res = await axios.get<EmployeeOption[]>(
    `${DEALER_BASE_URL}/Employee/Details/By/Authority`,
    {
      params: { id: groupId },
      headers: dealerHeaders(),
    }
  );

  return res.data;
};

export const createOnlineLead = async (
  formData: OnlineLeadFormData,
  companyId: number
): Promise<void> => {
  await axios.post(
    `${DEALER_POST_BASE_URL}/Neo/Online/Lead/Query`,
    {
      formJson: [formData],
      id: 0,
      companyid: companyId,
    },
    {
      headers: dealerHeaders(),
    }
  );
};

export const updateOnlineLead = async (
  leadId: number,
  companyId: number,
  originalFormData: OnlineLeadFormData,
  updates: Partial<OnlineLeadFormData>
): Promise<void> => {
  const mergedForm = {
    ...originalFormData,
    ...updates,
  };

  if (mergedForm.account_owner_id !== undefined) {
    mergedForm.account_owner_id = String(
      mergedForm.account_owner_id
    );
  }

  await axios.post(
    `${DEALER_POST_BASE_URL}/Neo/Online/Lead/Query`,
    {
      formJson: [mergedForm],
      id: leadId,
      companyid: companyId,
    },
    {
      headers: dealerHeaders(),
    }
  );
};

export const transferOnlineLead = async (
  leadId: number,
  employeeId: number
): Promise<void> => {
  await axios.post(
    `${DEALER_BASE_URL}/Neo/Online/Lead/Transfer/To/Lead/Query`,
    {
      id: leadId,
      employee_id: employeeId,
    },
    {
      headers: dealerHeaders(),
    }
  );
};