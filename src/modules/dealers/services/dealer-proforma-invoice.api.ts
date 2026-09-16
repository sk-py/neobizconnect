import { api } from "@/services/axios";

export const fetchDealerProformaInvoices = async (cardCode: string) => {
  const res = await api.get(`/Neo/PerformaInvoice/List`, {
    params: { user_code: cardCode },
  });
  return res.data;
};