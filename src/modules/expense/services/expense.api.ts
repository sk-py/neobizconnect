import { ExpenseListItem } from "../types";
import { expenseApi } from "./expense-api-client";

export const fetchExpenses = async (): Promise<ExpenseListItem[]> => {
  try {
    const res = await expenseApi.get<ExpenseListItem[]>("/api/dynamic-expense");
    console.log("EXPENSE LIST IDS:", res.data.map((e) => e.id));
    return res.data;
  } catch (err: any) {
    console.log("EXPENSE LIST ERROR:", err?.response?.status, JSON.stringify(err?.response?.data));
    throw err;
  }
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

// Server expects a single object {...}, NOT an array [...]
export const createExpense = async (payload: CreateExpensePayload): Promise<void> => {
  try {
    console.log("CREATE EXPENSE PAYLOAD:", JSON.stringify(payload));
    const res = await expenseApi.post("/api/dynamic-expense", payload);
    console.log("CREATE EXPENSE RESPONSE STATUS:", res.status);
    console.log("CREATE EXPENSE RESPONSE BODY:", JSON.stringify(res.data));
  } catch (err: any) {
    console.log("CREATE EXPENSE ERROR STATUS:", err?.response?.status);
    console.log("CREATE EXPENSE ERROR BODY:", JSON.stringify(err?.response?.data));
    throw err;
  }
};

// If multiple rows are added on the Create screen, loop and send one at a time
export const createExpenses = async (payloads: CreateExpensePayload[]): Promise<void> => {
  for (const p of payloads) {
    await createExpense(p);
  }
};

export type UpdateExpensePayload = Omit<CreateExpensePayload, "isDeleting">;

export const updateExpense = async (id: number, payload: UpdateExpensePayload): Promise<void> => {
  await expenseApi.put(`/api/dynamic-expense/${id}`, payload);
};