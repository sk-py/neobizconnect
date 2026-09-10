export type LeadFormData = {
  id?: number;
  city: string;
  state: string;
  alloys: string;
  source: string;
  status: string;
  phone_1: string;
  remarks: string;
  remarks2: string;
  car_model: string;
  account_owner: string;
  customer_name: string;
  lead_priority: string;
  type_of_query: string;
  brand_interest: string;
  account_owner_id: string;
  sales_manager_remarks: string;
};

export type LeadStageEntry = {
  stage: string;
  status: string;
  timestamp: string;
};

export type LeadRemarkEntry = {
  remark: string;
  timestamp: string;
};

export type LeadQuery = {
  id: number;
  companyid: number;
  employeeid: number;
  created_employee_id: number;
  lead_type: string;
  contact_id: number | null;
  account_id: number | null;
  formJson: LeadFormData[];
  productJson: any[];
  remarks_list: LeadRemarkEntry[];
  age: string;
  updatedDate: string;
  createdDate: string;
  stage_status_list: LeadStageEntry[];
  meeting_list: any[];
};

export type EmployeeOption = {
  id: number;
  name: string;
};

export const LEAD_STATUS_OPTIONS = [
  "In Progress",
  "Sold Offline",
  "On Hold",
  "Lost / Not Interested",
  "Price Enquiry",
  "Purchased Other Brand",
  "Design / Finish NA",
] as const;

export const TYPE_OF_QUERY_OPTIONS = [
  "New Alloy Set",
  "Dealership",
  "Exchange with Current Wheels",
  "Warranty Claims",
] as const;

export const LEAD_SOURCE_OPTIONS = ["Website", "Call", "WhatsApp", "Instagram", "Email"] as const;
export const LEAD_PRIORITY_OPTIONS = ["Hot", "Warm", "Cold"] as const;
export const BRAND_INTEREST_OPTIONS = ["Neo Wheels", "Zetta Alloys", "Other"] as const;
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;