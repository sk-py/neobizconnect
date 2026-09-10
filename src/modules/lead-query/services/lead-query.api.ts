import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import { EmployeeOption, LeadFormData, LeadQuery } from "../types";

// IMPORTANT: Sales Manager's Lead/Query is NOT on the main app's base URL
// (crm-uat/production) — it's the SAME dealer-uat backend used by Query
// Manager's Lead/Query. This makes sense: Query Manager assigns leads to a
// specific Sales Manager (via account_owner/account_owner_id), and that
// Sales Manager needs to see/update those same records from their own
// login. Confirmed via a real captured request showing this exact host +
// payload shape.
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
    // This host URL-decodes '+' in the Authorization header into a space,
    // causing "Illegal base64url character" errors otherwise — same fix
    // as Expense/Online Lead/Query Manager's Lead-Query.
    const safeToken = token.includes("+") ? token.replace(/\+/g, "%2B") : token;
    config.headers.Authorization = `Bearer ${safeToken}`;
  }
  return config;
});

export const fetchLeadQueries = async (): Promise<LeadQuery[]> => {
  const res = await dealerApi.get<LeadQuery[]>(`/Neo/Lead/Query`);
  return res.data;
};

// `groupId` = the logged-in user's `groupid` field (NOT authority_id) —
// confirmed pattern from Query Manager's capture (id=7 matched groupid:7).
export const fetchAssignedToOptions = async (groupId: number): Promise<EmployeeOption[]> => {
  const res = await dealerApi.get<EmployeeOption[]>(`/Employee/Details/By/Authority`, {
    params: { id: groupId },
  });
  return res.data;
};

// CONFIRMED via DevTools Network capture (201 Created response). Payload
// shape: { companyid, formJson: [...], id }.
//
// NOTE: the URL has a real double slash ("crm-uat//Crm") — confirmed
// working, not a typo.
//
// DEFENSIVE FIX: leads that came through the Online Lead → Lead/Query
// "Transfer" flow have account_owner_id stored as a NUMBER (a confirmed
// backend bug in the Transfer endpoint — reported to TL), while every
// normal record has it as a STRING. Sending a number here causes a 500
// (java.lang.Integer cannot be cast to java.lang.String). Force it to a
// string on every update so our app doesn't crash on these "poisoned"
// records while waiting for the backend fix. Safe to remove once TL
// confirms the Transfer endpoint is fixed.
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

  await dealerApi.post(
    "https://dealer-uat.actifyzone.com/crm-uat//Crm/Portal/Neo/Lead/Query",
    {
      formJson: [mergedForm],
      id: leadId,
      companyid: companyId,
    },
  );
};

// NOT independently confirmed for the CREATE case (id: 0) — same endpoint
// and shape as update, mirroring the confirmed pattern. Test in-app.
export const createLeadQuery = async (
  formData: LeadFormData,
  companyId: number,
): Promise<void> => {
  await dealerApi.post(
    "https://dealer-uat.actifyzone.com/crm-uat//Crm/Portal/Neo/Lead/Query",
    {
      formJson: [formData],
      id: 0,
      companyid: companyId,
    },
  );
};