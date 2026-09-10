import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import { EmployeeOption, LeadFormData, LeadQuery } from "../types";

// Same host as Expense and Online Lead — a different domain than the main
// app's base URL.
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
    // Same fix as Expense/Online Lead: this host URL-decodes '+' in the
    // Authorization header into a space, causing "Illegal base64url
    // character" errors otherwise.
    const safeToken = token.includes("+") ? token.replace(/\+/g, "%2B") : token;
    config.headers.Authorization = `Bearer ${safeToken}`;
  }
  return config;
});

// Confirmed real endpoint (captured via DevTools Network tab).
export const fetchLeadQueries = async (): Promise<LeadQuery[]> => {
  const res = await dealerApi.get<LeadQuery[]>(`/Neo/Lead/Query`);
  return res.data;
};

// Confirmed real endpoint. `groupId` corresponds to the logged-in user's
// `groupid` field (NOT authority_id) — verified from the captured request
// (id=7 matched groupid:7 in the login response, while authority_id was 6).
export const fetchAssignedToOptions = async (groupId: number): Promise<EmployeeOption[]> => {
  const res = await dealerApi.get<EmployeeOption[]>(`/Employee/Details/By/Authority`, {
    params: { id: groupId },
  });
  return res.data;
};

// NOT independently confirmed for the CREATE case (id: 0) — only the
// UPDATE case (existing id) was captured and verified. Same endpoint,
// method, and payload shape as update, just with id: 0 for a new record —
// this mirrors the pattern used by the Online Lead module's confirmed
// create call. Test in-app and verify the response before fully relying on
// this.
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

// CONFIRMED via DevTools Network capture (201 Created response). Payload
// shape matches exactly: { companyid, formJson: [...], id }.
//
// NOTE: the URL genuinely has a double slash ("crm-uat//Crm") — this isn't
// a typo, it's the real confirmed-working request (same pattern also seen
// on the Online Lead POST endpoint). Using an absolute URL here to match
// exactly rather than composing through the axios instance's baseURL,
// since we don't want to guess whether the backend treats // vs / as
// equivalent everywhere.
//
// account_owner_id: normal Lead/Query records already return this as a
// string from GET. HOWEVER, records created via the Online Lead →
// Lead/Query "Transfer" flow have it stored as a NUMBER (a confirmed
// backend bug in the Transfer endpoint — reported to TL), which causes a
// 500 on update (java.lang.Integer cannot be cast to java.lang.String).
// Force String() defensively so this module doesn't crash on those
// "poisoned" records either, regardless of which type slips through.
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