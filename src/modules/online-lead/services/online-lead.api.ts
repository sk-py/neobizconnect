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

// CONFIRMED shape — this matches the actual payload given directly
// (formJson: [...], id: 0, companyid), same double-slash URL pattern
// confirmed working for Lead/Query's update.
// CONFIRMED shape — this matches the actual payload given directly
// (formJson: [...], id: 0, companyid), same double-slash URL pattern
// confirmed working for Lead/Query's update.
export const createOnlineLead = async (
  formData: OnlineLeadFormData,
  companyId: number,
): Promise<void> => {
  await dealerApi.post(
    "https://dealer-uat.actifyzone.com/crm-uat//Crm/Portal/Neo/Online/Lead/Query",
    {
      formJson: [formData],
      id: 0,
      companyid: companyId,
    },
  );
};

// CONFIRMED via DevTools Network capture (201 Created response). Payload
// shape: { companyid, formJson: [...], id } — matches exactly the
// best-guess pattern that was already here, now verified.
//
// DEFENSIVE FIX: account_owner_id isn't editable in this module's UI, but
// it's present on real fetched records and gets carried through the
// update merge as-is. Confirmed (via Hoppscotch test on this exact
// endpoint) that sending it as a NUMBER causes a 500 error — same bug
// reported to TL for Lead/Query. Force it to a string here too, if
// present, so this module doesn't hit the same crash.
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

  await dealerApi.post(
    "https://dealer-uat.actifyzone.com/crm-uat//Crm/Portal/Neo/Online/Lead/Query",
    {
      formJson: [mergedForm],
      id: leadId,
      companyid: companyId,
    },
  );
};

// CONFIRMED via DevTools Network capture (201 Created response). A
// completely different, much simpler endpoint than Update — note this one
// has a SINGLE slash ("crm-uat/Crm"), unlike the double-slash pattern used
// by List/Update. Moves the online lead into Lead/Query, assigning the
// given employee as account_owner. Payload is just { id, employee_id }.
export const transferOnlineLead = async (
  leadId: number,
  employeeId: number,
): Promise<void> => {
  await dealerApi.post(
    "https://dealer-uat.actifyzone.com/crm-uat/Crm/Portal/Neo/Online/Lead/Transfer/To/Lead/Query",
    {
      id: leadId,
      employee_id: employeeId,
    },
  );
};