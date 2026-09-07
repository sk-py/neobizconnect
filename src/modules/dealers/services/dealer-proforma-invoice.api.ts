import { api } from "@/services/axios";

export const fetchDealerProformaInvoices = async (cardCode: string) => {
  try {
    const res = await api.get(`/Neo/PerformaInvoice/List`, {
      params: { user_code: cardCode },
    });
    console.log("PROFORMA INVOICE SUCCESS:", JSON.stringify(res.data));
    return res.data;
  } catch (err: any) {
    console.log("PROFORMA INVOICE ERROR:", err?.response?.status, err?.message);
    throw err;
  }
};