export type ExpenseStatus = "Pending" | "Approved" | "Rejected";

export type ExpenseCategory = {
  id: string;
  name: string;
  subCategories: string[];
};

export type ExpenseListItem = {
  id: string;
  title: string;
  date: string;
  status: ExpenseStatus;
  category: string;
  subCategory: string;
  description: string;
  attachmentUrl?: string;
  amount: number;
  remarks?: string;
};

export type ExpenseRowDraft = {
  localId: string;
  title: string;
  date: string;
  category: string;
  subCategory: string;
  description: string;
  amount: string;
  attachmentUri?: string;
  attachmentName?: string;
};

// Placeholder categories until we get the real list from the API
export const MOCK_CATEGORIES: ExpenseCategory[] = [
  {
    id: "travel",
    name: "Travel",
    subCategories: ["Fuel", "Bus/Train", "Taxi/Cab", "Toll/Parking"],
  },
  {
    id: "food",
    name: "Food",
    subCategories: ["Breakfast", "Lunch", "Dinner", "Snacks"],
  },
  {
    id: "accommodation",
    name: "Accommodation",
    subCategories: ["Hotel", "Guest House"],
  },
  {
    id: "office",
    name: "Office Supplies",
    subCategories: ["Stationery", "Printing", "Courier"],
  },
  {
    id: "other",
    name: "Other",
    subCategories: ["Miscellaneous"],
  },
];