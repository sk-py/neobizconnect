import { api } from "@/services/axios";

export const fetchDealerArCreditMemos = async (cardCode: string) => {
  const res = await api.get(`/Neo/ARCreditMemo/List`, {
    params: { user_code: cardCode },
  });
  return res.data;
};