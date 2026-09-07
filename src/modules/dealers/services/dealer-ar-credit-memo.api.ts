import { api } from "@/services/axios";

export const fetchDealerArCreditMemos = async (cardCode: string) => {
  try {
    const res = await api.get(`/Neo/ARCreditMemo/List`, {
      params: { user_code: cardCode },
    });
    console.log("AR CREDIT MEMO SUCCESS:", JSON.stringify(res.data));
    return res.data;
  } catch (err: any) {
    console.log("AR CREDIT MEMO ERROR:", err?.response?.status, err?.message);
    throw err;
  }
};