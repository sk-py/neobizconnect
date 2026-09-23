import { api } from "@/services/axios";
import { ExpenseListItem } from "../types";

export type CreateExpensePayload = {
  title: string;
  date: string;
  category: string;
  subCategory: string;
  description: string;
  attachment: string;
  amount: string | number;
  isUploading: boolean;
  status: string;
  remarks: string;
  employee_id: string | number;
  employee_name: string;
};

export type UpdateExpensePayload = CreateExpensePayload;

const getEndpoint = (path = ""): string => {
  const base = api.defaults.baseURL || "";
  const hasApi = base.endsWith("/api") || base.endsWith("/api/");
  const prefix = hasApi ? "dynamic-expense" : "api/dynamic-expense";
  return path ? `${prefix}/${path}` : prefix;
};

const sanitize = (payload: Partial<CreateExpensePayload>) => ({
  title: String(payload.title ?? ""),
  date: String(payload.date ?? ""),
  category: String(payload.category ?? ""),
  subCategory: String(payload.subCategory ?? "none"),
  description: String(payload.description ?? ""),
  attachment: String(payload.attachment ?? ""),
  amount: String(payload.amount ?? "0"),
  isUploading: Boolean(payload.isUploading),
  status: String(payload.status ?? "Pending"),
  remarks: String(payload.remarks ?? ""),
  employee_id: String(payload.employee_id ?? "7"),
  employee_name: String(payload.employee_name ?? ""),
});

export const fetchExpenses = async (): Promise<ExpenseListItem[]> => {
  const res = await api.get<ExpenseListItem[] | { expenses: ExpenseListItem[] }>(getEndpoint());
  const data = res.data;

  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as any).expenses)) return (data as any).expenses;
  return [];
};

export const createExpense = async (payload: CreateExpensePayload): Promise<void> => {
  await api.post(getEndpoint(), sanitize(payload));
};

export const createExpenses = async (payloads: CreateExpensePayload[]): Promise<void> => {
  await Promise.all(payloads.map((p) => createExpense(p)));
};

export const updateExpense = async (
  id: number | string,
  payload: UpdateExpensePayload
): Promise<void> => {
  await api.put(getEndpoint(String(id)), sanitize(payload));
};

export const deleteExpense = async (id: number | string): Promise<void> => {
  await api.delete(getEndpoint(String(id)));
};