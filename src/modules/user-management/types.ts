export interface DealerEmployee {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  number: string;
  employee_code: string | null;
  authorityid: number;
  authority_name: string;
  login_status: "Active" | "Inactive" | string;
  lock_status: number;
  account_password: string;
  companyid: number;
  groupid: number;
  locationid: number;
  branchid: number;
  department?: string;
  designation?: string;
  region?: string;
  territory?: string;
  zone?: string;
  city?: string;
  state?: string;
  country?: string;
  pin_code?: string;
  company_name?: string;
  groupcompany_name?: string;
  locationcompany_name?: string;
  branchcompany_name?: string;
  manager?: unknown[];
}

export interface UserCountSummary {
  active: number;
  inactive: number;
  total: number;
}

export interface CreateUserPayload {
  firstName: string;
  lastName?: string;
  email: string;
  mobile?: string;
  authorityId: number;
  password: string;
}

export const AUTHORITY_OPTIONS: { label: string; value: number }[] = [
  { label: "Super Admin", value: 2 },
  { label: "Admin", value: 3 },
  { label: "Sales Manager", value: 5 },
  { label: "Query Manager", value: 6 },
];