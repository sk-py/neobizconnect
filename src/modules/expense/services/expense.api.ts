import { expenseApi } from "./expense-api-client";
import { ExpenseListItem } from "../types";

export const fetchExpenses = async (): Promise<ExpenseListItem[]> => {
  const res = await expenseApi.get<any>(`/api/dynamic-expense`);
  
  // Handle both formats: { expenses: [...] } or [...]
  const data = res.data;
  
  if (Array.isArray(data)) {
    console.log("LIST IDS (direct array):", data.map((e) => e.id));
    return data;
  } else if (data && Array.isArray(data.expenses)) {
    console.log("LIST IDS (wrapped):", data.expenses.map((e: any) => e.id));
    return data.expenses;
  }
  
  console.log("LIST IDS (empty/fallback):", []);
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
  console.log("═══════════════════════════════════════");
  console.log("📦 PAYLOAD TO SEND:");
  console.log(JSON.stringify({ expenses: [payload] }, null, 2));
  console.log("═══════════════════════════════════════");
  
  await expenseApi.post("/api/dynamic-expense", { 
    expenses: [payload] 
  });
};

export const createExpenses = async (payloads: CreateExpensePayload[]): Promise<void> => {
  console.log("═══════════════════════════════════════");
  console.log("📦 PAYLOADS TO SEND:");
  console.log(JSON.stringify({ expenses: payloads }, null, 2));
  console.log("═══════════════════════════════════════");
  
  await expenseApi.post("/api/dynamic-expense", { 
    expenses: payloads 
  });
};

export type UpdateExpensePayload = Omit<CreateExpensePayload, "isDeleting">;

export const updateExpense = async (id: number, payload: UpdateExpensePayload): Promise<void> => {
  await expenseApi.put(`/api/dynamic-expense/${id}`, { expenses: [payload] });
};

export const deleteExpense = async (id: number): Promise<void> => {
  await expenseApi.delete(`/api/dynamic-expense/${id}`);
};