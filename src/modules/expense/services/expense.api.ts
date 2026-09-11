import { api } from "@/services/axios";
import { ExpenseListItem } from "../types";

export const fetchExpenses = async (): Promise<ExpenseListItem[]> => {
  const res = await api.get<any>("/api/dynamic-expense");
  const data = res.data;

  if (Array.isArray(data)) {
    return data;
  } else if (data && Array.isArray(data.expenses)) {
    return data.expenses;
  }

  return [];
};

export type CreateExpensePayload = {
  title: string;
  date: string;
  category: string;
  subCategory: string;
  description: string;
  attachment: string;
  amount: string;
  isUploading: boolean;
  isDeleting: boolean;
  status: string;
  remarks: string;
  employee_id: string;
  employee_name: string;
};

export const createExpense = async (payload: CreateExpensePayload): Promise<void> => {
  await api.post("/api/dynamic-expense", {
    expenses: [payload],
  });
};

export const createExpenses = async (payloads: CreateExpensePayload[]): Promise<void> => {
  await api.post("/api/dynamic-expense", {
    expenses: payloads,
  });
};

export type UpdateExpensePayload = Omit<CreateExpensePayload, "isDeleting">;

export const updateExpense = async (id: number, payload: UpdateExpensePayload): Promise<void> => {
  await api.put(`/api/dynamic-expense/${id}`, { expenses: [payload] });
};

export const deleteExpense = async (id: number): Promise<void> => {
  await api.delete(`/api/dynamic-expense/${id}`);
};