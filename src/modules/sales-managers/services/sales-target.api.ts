import { api } from "@/services/axios";
import {
  AssignSalesQuotaPayload,
  SalesQuotaListItem,
  SalesQuotaListParams,
} from "../types";

export const fetchSalesQuotaList = async (
  params: SalesQuotaListParams,
): Promise<SalesQuotaListItem[]> => {
  const res = await api.post<SalesQuotaListItem[]>(
    `/List/Sales/Quota`,
    params,
  );
  return res.data;
};

export const assignSalesQuota = async (
  payload: AssignSalesQuotaPayload,
) => {
  const res = await api.post(`/Add/Sales/Quota`, payload);
  return res.data;
};