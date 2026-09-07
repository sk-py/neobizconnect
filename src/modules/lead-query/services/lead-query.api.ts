import { api } from "@/services/axios";
import { LeadQuery } from "../types";

export const fetchLeadQueries = async (): Promise<LeadQuery[]> => {
  const response = await api.get<LeadQuery[]>(`/Neo/Lead/Query`);
  return response.data;
};

export const updateLeadQuery = async (
  lead: LeadQuery,
  status: string,
  remarks: string,
): Promise<void> => {
  const originalForm = lead.formJson?.[0] ?? {};

  const payload = {
    formJson: [
      {
        ...originalForm,
        status,
        sales_manager_remarks: remarks,
        id: lead.id,
        account_owner_id: String(originalForm.account_owner_id ?? ""),
      },
    ],
    id: lead.id,
    companyid: lead.companyid,
  };

  try {
    console.log("LEAD UPDATE PAYLOAD:", JSON.stringify(payload));
    await api.post(`/Neo/Lead/Query`, payload);
  } catch (err: any) {
    console.log("LEAD UPDATE ERROR STATUS:", err?.response?.status);
    console.log("LEAD UPDATE ERROR BODY:", JSON.stringify(err?.response?.data));
    throw err;
  }
};