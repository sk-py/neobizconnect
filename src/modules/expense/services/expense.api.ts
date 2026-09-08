import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import { ExpenseListItem } from "../types";

const expenseApi = axios.create({
  baseURL: "https://dealer-uat.actifyzone.com/crm-uat/Crm/Portal",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

expenseApi.interceptors.request.use((config) => {
  let token = (useAuthStore.getState().accessToken || "").trim();
  token = token.replace(/^Bearer\s+/i, "").trim();
  if (token) {
    const safeToken = token.includes("+") ? token.replace(/\+/g, "%2B") : token;
    config.headers.Authorization = `Bearer ${safeToken}`;
  }
  return config;
});

export const fetchExpenses = async (): Promise<ExpenseListItem[]> => {
  const res = await expenseApi.get<ExpenseListItem[]>(
    `/api/dynamic-expense?_=${Date.now()}`
  );
  console.log("LIST IDS:", res.data.map((e) => e.id));
  return res.data;
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
  console.log("CREATE PAYLOAD:", JSON.stringify(payload));
  const res = await expenseApi.post("/api/dynamic-expense", payload);
  console.log("CREATE RESPONSE:", res.status, JSON.stringify(res.data));
};

export const createExpenses = async (payloads: CreateExpensePayload[]): Promise<void> => {
  for (const p of payloads) {
    await createExpense(p);
  }
};

export type UpdateExpensePayload = Omit<CreateExpensePayload, "isDeleting">;

export const updateExpense = async (id: number, payload: UpdateExpensePayload): Promise<void> => {
  await expenseApi.put(`/api/dynamic-expense/${id}`, payload);
};