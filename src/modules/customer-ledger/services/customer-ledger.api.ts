import { api } from "@/services/axios";
import { File, Paths } from "expo-file-system";
import { CustomerLedgerResponse } from "../types";

export const fetchCustomerLedger = async (
  groupCompanyName: string,
  fromDate?: string | null,
  toDate?: string | null,
): Promise<CustomerLedgerResponse> => {
  const params: Record<string, string> = {};
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const res = await api.get(`/Neo/SAP/GetAccountBalance/Dealer`, { params });
  return res.data;
};

export const downloadAndOpenLedgerPdf = async (
  groupCompanyName: string,
  docEntry: string,
) => {
  const response = await api.post(
    `/Neo/SAP/InvoicePDF`,
    { DocEntry: docEntry },
    { responseType: "arraybuffer" },
  );

  const file = new File(Paths.cache, `LedgerInvoice_${docEntry}.pdf`);

  if (file.exists) {
    file.delete();
  }

  file.create();
  file.write(new Uint8Array(response.data));

  return file.uri;
};

export const fetchDealersList = async () => {
  const res = await api.get(`/Neo/Dealer/User/AccountBalenceList`);
  return res.data;
};

export const fetchDealerAccountBalance = async (cardCode: string) => {
  const res = await api.post(`/Neo/SAP/GetAccountBalance`, {
    cardcode: cardCode,
  });
  return res.data;
};
