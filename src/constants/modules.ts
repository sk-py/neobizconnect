export type UserRole =
  | "Dealer"
  | "Sales Manager"
  | "Admin"
  | "Super Admin"
  | "Query Manager";

export type ModulePermission = {
  name: string;
  roles: readonly UserRole[];
};

export const MODULES = [
  {
    name: "Tracker",
    roles: ["Sales Manager"],
  },
  {
    name: "Dashboard",
    roles: ["Sales Manager", "Dealer"],
  },
  {
    name: "Sales Order",
    roles: ["Dealer"],
  },
  {
    name: "Order History",
    roles: ["Sales Manager", "Dealer"],
  },
  {
    name: "Customer Ledger",
    roles: ["Sales Manager", "Dealer"],
  },
  {
    name: "Dealer Query",
    roles: ["Sales Manager", "Dealer"],
  },
  {
    name: "Sub Dealers",
    roles: ["Sales Manager"],
  },
  {
    name: "Sales Targets",
    roles: ["Sales Manager"],
  },
] as const satisfies readonly ModulePermission[];

export type AppModuleName = (typeof MODULES)[number]["name"];

export const hasModuleAccess = (
  moduleName: AppModuleName,
  role: UserRole | undefined,
): boolean => {
  if (!role) return false;
  const targetModule = MODULES.find((m) => m.name === moduleName);
  return targetModule
    ? (targetModule.roles as readonly UserRole[]).includes(role)
    : false;
};
