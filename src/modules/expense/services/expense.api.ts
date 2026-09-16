import axios from "axios";
import { BASE_URL } from "@/constants/config";
import { useAuthStore } from "@/store/auth.store";
import { ExpenseListItem } from "../types";

const DEALER_BASE_URL = BASE_URL.replace(
  "crm-uat.actifyzone.com",
  "dealer-uat.actifyzone.com"
);

const dealerHeaders = () => {
  const raw = (useAuthStore.getState().accessToken || "")
    .replace(/^Bearer\s+/i, "")
    .trim();

  const safe = raw.includes("+")
    ? raw.replace(/\+/g, "%2B")
    : raw;

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${safe}`,
  };
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

export type UpdateExpensePayload = Omit<
  CreateExpensePayload,
  "isDeleting"
>;

export const fetchExpenses = async (): Promise<
  ExpenseListItem[]
> => {
  const res = await axios.get<
    ExpenseListItem[] | { expenses: ExpenseListItem[] }
  >(`${DEALER_BASE_URL}/api/dynamic-expense`, {
    headers: dealerHeaders(),
  });

  const data = res.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.expenses)) {
    return data.expenses;
  }

  return [];
};

export const createExpenses = async (
  payloads: CreateExpensePayload[]
): Promise<void> => {
  await axios.post(
    `${DEALER_BASE_URL}/api/dynamic-expense`,
    {
      expenses: payloads,
    },
    {
      headers: dealerHeaders(),
    }
  );
};

export const createExpense = async (
  payload: CreateExpensePayload
): Promise<void> => {
  await createExpenses([payload]);
};

export const updateExpense = async (
  id: number,
  payload: UpdateExpensePayload
): Promise<void> => {
  await axios.put(
    `${DEALER_BASE_URL}/api/dynamic-expense/${id}`,
    {
      expenses: [payload],
    },
    {
      headers: dealerHeaders(),
    }
  );
};

export const deleteExpense = async (
  id: number
): Promise<void> => {
  await axios.delete(
    `${DEALER_BASE_URL}/api/dynamic-expense/${id}`,
    {
      headers: dealerHeaders(),
    }
  );
};