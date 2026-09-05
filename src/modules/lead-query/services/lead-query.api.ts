import { api } from "@/services/axios";
import { LeadQuery } from "../types";

export const fetchLeadQueries = async (): Promise<LeadQuery[]> => {
  const response = await api.get<LeadQuery[]>(`/Neo/Lead/Query`);
  return response.data;
};