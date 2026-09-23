import { api } from "@/services/axios";
import { ArCreditMemoDocument, ArCreditMemoStats } from "../types";

export const fetchArCreditMemos = async (): Promise<ArCreditMemoDocument[]> => {
  const res = await api.get(`/Neo/ARCreditMemo/List`);
  return res.data;
};

export const fetchArCreditMemoStats = async (): Promise<ArCreditMemoStats> => {
  const res = await api.get(`/Neo/ARCreditMemo/Count/Data`);
  return res.data;
};
