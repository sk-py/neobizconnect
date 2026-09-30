export type SalesManagerEmployeeDetails = {
  id: number;
  employee_code: string;
  firstname: string;
  lastname: string;
  email: string;
  number: string;
  department: string;
  designation: string;
  region: string;
  territory: string;
  zone: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  account_password: string;
  lock_status: number | null;
  login_status: string; 
  authorityid: number;
  companyid: number;
  groupid: number;
  locationid: number;
  branchid: number;
};

export type SalesManager = {
  id: number;
  lock_status: number | null;
  email: string;
  locked: "tYES" | "tNO" | string;
  remarks: string;
  employeeDetails: SalesManagerEmployeeDetails | null;
  commissionForSalesEmployee: number;
  commissionGroup: number;
  employeeID: number;
  fax: string;
  u_DealerPortal: string | null;
  active: "tYES" | "tNO" | string;
  salesEmployeeName: string;
  telephone: string;
  salesEmployeeCode: string;
  mobile: string;
};
// --- Sales Quota (POST /List/Sales/Quota, POST /Add/Sales/Quota) ---
// This endpoint is shared across roles (e.g. "Dealer", "Sales Manager");
// this module only drives it for "Sales Manager".
export type QuotaRole = "Dealer" | "Sales Manager";

export const QUOTA_MONTHS = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
] as const;

export type QuotaMonthName = (typeof QUOTA_MONTHS)[number];

export type SalesQuotaMonthDetail = {
  id: number;
  user_code: string;
  name: string;
  role: QuotaRole;
  financial_year: string;
  month: QuotaMonthName | string;
  amount: number;
  quantity: number;
  amount_percentage: number;
  quantity_percentage: number;
  target_amount: number | null;
  target_quantity: number;
};

export type SalesQuotaListItem = {
  user_code: string;
  name: string;
  role: QuotaRole;
  sales_manager: string;
  financial_year: string;
  annual_target: number;
  annual_quantity: number;
  details: SalesQuotaMonthDetail[];
};

export type SalesQuotaListParams = {
  role: QuotaRole;
  financial_year: string;
};

export type SalesQuotaMonthInput = {
  month: QuotaMonthName | string;
  amount: number;
  quantity: number;
  amount_percentage: number;
  quantity_percentage: number;
};

export type AssignSalesQuotaPayload = {
  role: QuotaRole;
  user_code: string;
  financial_year: string;
  annual_target: number;
  annual_quantity: number;
  quota: SalesQuotaMonthInput[];
};