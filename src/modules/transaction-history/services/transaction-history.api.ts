import { api } from "@/services/axios";
import { Transaction } from "../types";

export const fetchTransactionHistory = async (): Promise<Transaction[]> => {
  const response = await api.get<Transaction[]>(`/SAP/Push/Sales/Order`);
  return response.data;
};