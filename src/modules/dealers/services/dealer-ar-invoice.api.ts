import { api } from "@/services/axios";
import type { ArInvoicePage } from "@/modules/dealers/types";

export const fetchDealerArInvoices = async (
  cardCode: string,
  page: number = 0,
  size: number = 10,
): Promise<ArInvoicePage> => {
  const res = await api.get(`/Neo/Invoice/List/Pagenation`, {
    params: { user_code: cardCode, page, size },
  });

  const raw = res.data;

  if (Array.isArray(raw)) {
    return {
      content: raw,
      currentPage: 0,
      totalItems: raw.length,
      totalPages: 1,
      isLast: true,
      size: raw.length,
    };
  }

  return {
    content: raw?.content ?? [],
    currentPage: raw?.currentPage ?? 0,
    totalItems: raw?.totalItems ?? 0,
    totalPages: raw?.totalPages ?? 1,
    isLast: raw?.isLast ?? true,
    size: raw?.size ?? size,
  };
};