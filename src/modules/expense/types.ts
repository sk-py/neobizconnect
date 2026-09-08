export type ExpenseListItem = {
  id: number;
  title: string;
  date: string;
  category: string;
  subCategory: string;
  description: string;
  attachment: string;
  amount: number;
  isUploading?: boolean;
  isDeleting?: boolean;
  status: string;
  remarks: string;
  employeeId: number;
  employeeName: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
};

export type ExpenseCategory = {
  id: number;
  name: string;
  subCategories: string[];
};

export const MOCK_CATEGORIES: ExpenseCategory[] = [
  { id: 1, name: "Travelling Allowance", subCategories: ["Auto", "Train", "Flight"] },
  { id: 2, name: "Accommodation Allowance", subCategories: ["Single", "Double", "Suite"] },
  { id: 3, name: "Local Conveyance", subCategories: ["Car", "Auto", "Bus"] },
  { id: 4, name: "Miscellaneous", subCategories: ["none"] },
];