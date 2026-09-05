import { api } from "@/services/axios";

export const fetchDealerArInvoices = async (cardCode: string) => {
  const res = await api.get(`/Neo/Invoice/List/Pagenation`, {
    params: { user_code: cardCode },
  });
  return res.data;
};