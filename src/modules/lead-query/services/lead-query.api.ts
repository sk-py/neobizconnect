import { api } from "@/services/axios";
import { LeadQuery } from "../types";

export const fetchLeadQueries = async (): Promise<LeadQuery[]> => {
  const response = await api.get<LeadQuery[]>(`/Neo/Lead/Query`);
  return response.data;
};

// NOTE: No real update/save endpoint has been provided yet.
// This is a placeholder so the UI can be built and tested now.
// Once the TL gives the actual endpoint, replace the body below
// with a real api.post/api.put call.
export const updateLeadQuery = async (
  leadId: number,
  status: string,
  remarks: string,
): Promise<void> => {
  throw new Error(
    "Update endpoint not configured yet — ask TL for the correct URL to save lead status/remarks.",
  );
};