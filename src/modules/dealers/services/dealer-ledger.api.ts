import { api } from "@/services/axios";
export const fetchDealerLedger = async (
  cardCode: string,
  fromDate?: string,
  toDate?: string,
) => {
  const params: Record<string, string> = { user_code: cardCode };
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const res = await api.get(`/Neo/SAP/GetAccountBalance/Dealer`, { params });
  return res.data;
};