export type UserRole =
  | "Dealer"
  | "Sales Manager"
  | "Query Manager"
  | "Admin"
  | "None"
  | "Super Admin";

export type AppModuleName =
  | "Tracker"
  | "Dashboard"
  | "Dealers"
  | "Sales Managers"
  | "Item Master"
  | "Transaction History"
  | "Sales Order"
  | "Order History"
  | "Customer Ledger"
  | "Dealer Query"
  | "Sub Dealers"
  | "Sub Dealer List"
  | "Sub Dealer Sales Target"
  | "Expense"
  | "Lead Query"
  | "Dealer Lead Query"
  | "Online Lead"
  | "Sales Manager Modules";

export const MODULES: Record<AppModuleName, readonly UserRole[]> = {
  Tracker: ["None"],
  Dashboard: [
    "Sales Manager",
    "Dealer",
    "Query Manager",
    "Admin",
    "Super Admin",
  ],
  "Sales Order": ["Dealer"],
  Dealers: ["Sales Manager", "Super Admin", "Admin"],
  "Sales Managers": ["Admin", "Super Admin"],
  "Item Master": ["Sales Manager", "Admin", "Super Admin"],
  "Transaction History": ["Sales Manager", "Admin", "Super Admin"],
  "Order History": ["Sales Manager", "Dealer", "Admin", "Super Admin"],
  "Customer Ledger": ["Sales Manager", "Dealer", "Admin", "Super Admin"],
  "Dealer Query": ["Dealer", "Admin", "Super Admin"],
   "Sub Dealers": ["Sales Manager", "Dealer"],
  "Sub Dealer List": ["Admin", "Super Admin"],
  "Sub Dealer Sales Target": ["Admin", "Super Admin"],
  Expense: ["Sales Manager"],
  "Lead Query": ["Sales Manager", "Admin", "Super Admin"],
  "Sales Manager Modules": ["Sales Manager"],
  "Dealer Lead Query": ["Query Manager"],
  "Online Lead": ["Query Manager", "Admin", "Super Admin"],
};

export const hasModuleAccess = (
  moduleName: AppModuleName,
  role: UserRole | undefined,
): boolean => {
  if (!role) return false;
  return MODULES[moduleName]?.includes(role) ?? false;
};