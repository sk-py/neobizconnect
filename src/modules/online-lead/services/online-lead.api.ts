import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import { EmployeeOption, OnlineLead, OnlineLeadFormData } from "../types";

// Same host as Lead/Query, Expense — the dealer-uat backend.
const DEALER_BASE_URL = "https://dealer-uat.actifyzone.com/crm-uat/Crm/Portal";

export const dealerApi = axios.create({
  baseURL: DEALER_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

dealerApi.interceptors.request.use((config) => {
  let token = (useAuthStore.getState().accessToken || "").trim();
  token = token.replace(/^Bearer\s+/i, "").trim();

  if (token) {
    const safeToken = token.includes("+") ? token.replace(/\+/g, "%2B") : token;
    config.headers.Authorization = `Bearer ${safeToken}`;
  }
  return config;
});

// CONFIRMED endpoint (given directly).
export const fetchOnlineLeads = async (): Promise<OnlineLead[]> => {
  const res = await dealerApi.get<OnlineLead[]>(`/Neo/Online/Lead/Query`);
  return res.data;
};

// Reused from Lead/Query — same Employee list API, same host. Powers the
// "Assign Employee" dropdown in the Transfer modal.
export const fetchAssignedToOptions = async (groupId: number): Promise<EmployeeOption[]> => {
  const res = await dealerApi.get<EmployeeOption[]>(`/Employee/Details/By/Authority`, {
    params: { id: groupId },
  });
  return res.data;
};

// NOT CONFIRMED — no network capture done yet for the "Update Query"
// button on the Online Lead edit form. This is a placeholder mirroring
// the Lead/Query pattern (same host, POST with formJson) as a best guess.
// DO NOT treat as working until verified — replace once captured.
export const updateOnlineLead = async (
  leadId: number,
  companyId: number,
  originalFormData: OnlineLeadFormData,
  updates: Partial<OnlineLeadFormData>,
): Promise<void> => {
  throw new Error(
    "Update endpoint not confirmed yet — capture the real request via DevTools before this can work.",
  );
  // Best-guess shape, unused until confirmed:
  // const mergedForm = { ...originalFormData, ...updates };
  // await dealerApi.post(`/Neo/Online/Lead/Query`, {
  //   formJson: [mergedForm],
  //   id: leadId,
  //   companyid: companyId,
  // });
};

// NOT CONFIRMED — no network capture done yet for the "Transfer" button
// (arrow icon → select employee → Transfer). We don't even know the
// endpoint path for this yet — it's a distinct action from Update, likely
// moves/copies the record into Lead/Query with the chosen employee as
// account_owner. DO NOT call this until the real endpoint is captured.
export const transferOnlineLead = async (
  _leadId: number,
  _employeeId: number,
): Promise<void> => {
  throw new Error(
    "Transfer endpoint not confirmed yet — capture the real request via DevTools before this can work.",
  );
};