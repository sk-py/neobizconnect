import { api } from "@/services/axios";
import { ArCreditMemoDocument, ArCreditMemoStats } from "../types";

export const fetchArCreditMemos = async (): Promise<ArCreditMemoDocument[]> => {
  const res = await api.get(`/Neo/ARCreditMemo/List`);
  console.log("CREDIT MEMO RAW:", JSON.stringify(res.data?.[0] ?? res.data, null, 2));
  return res.data;
};

export const fetchArCreditMemoStats = async (): Promise<ArCreditMemoStats> => {
  const res = await api.get(`/Neo/ARCreditMemo/Count/Data`);
  return res.data;
};