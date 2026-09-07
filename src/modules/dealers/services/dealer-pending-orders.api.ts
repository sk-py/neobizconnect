import { api } from "@/services/axios";

export const fetchDealerPendingOrders = async (cardCode: string) => {
  const res = await api.get(`/Neo/SalesOrder/List`, {
    params: { user_code: cardCode },
  });
  return res.data;
};