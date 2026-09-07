import { api } from "@/services/axios";

export const fetchDealerArInvoices = async (cardCode: string) => {
  try {
    const res = await api.get(`/Neo/Invoice/List/Pagenation`, {
      params: { user_code: cardCode },
    });
    console.log("AR INVOICE SUCCESS:", JSON.stringify(res.data));
    return res.data;
  } catch (err: any) {
    console.log("AR INVOICE ERROR:", err?.response?.status, err?.message);
    throw err;
  }
};