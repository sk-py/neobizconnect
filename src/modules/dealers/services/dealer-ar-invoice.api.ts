import { api } from "@/services/axios";
const extractInvoiceList = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;

  const candidateKeys = [
    "data",
    "Data",
    "items",
    "Items",
    "records",
    "Records",
    "result",
    "Result",
    "results",
    "Results",
    "list",
    "List",
    "rows",
    "Rows",
    "invoices",
    "Invoices",
    "content",
    "Content",
  ];

  for (const key of candidateKeys) {
    if (Array.isArray(raw?.[key])) {
      return raw[key];
    }
  }

  return [];
};

export const fetchDealerArInvoices = async (cardCode: string) => {
  const res = await api.get(`/Neo/Invoice/List/Pagenation`, {
    params: { user_code: cardCode },
  });

  return extractInvoiceList(res.data);
};