import { api } from "@/services/axios";
import { CustomerLedgerResponse } from "@/modules/customer-ledger/types";

export const fetchDealerLedger = async (
  cardCode: string,
): Promise<CustomerLedgerResponse> => {
  const res = await api.get(`/Neo/SAP/GetAccountBalance/Dealer`, {
    params: { user_code: cardCode },
  });
  return res.data;
};