// Confirmed real data — Sales Manager's Lead/Query lives on the same
// dealer-uat backend as Query Manager's Lead/Query (leads assigned by
// Query Manager to a Sales Manager show up here). Field names verified
// from actual captured API responses, not guessed.
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

// Confirmed real values (In Progress, Sold Offline, On Hold,
// Lost / Not Interested seen in actual records; Price Enquiry, Purchased
// Other Brand, Design/Finish NA confirmed via the web dropdown).
export const LEAD_STATUS_OPTIONS = [
  "In Progress",
  "Sold Offline",
  "On Hold",
  "Lost / Not Interested",
  "Price Enquiry",
  "Purchased Other Brand",
  "Design / Finish NA",
] as const;

// Confirmed from real data ("New Alloy Set", "Dealership" both seen in
// actual records) plus the additional options requested.
export const TYPE_OF_QUERY_OPTIONS = [
  "New Alloy Set",
  "Dealership",
  "Exchange with Current Wheels",
  "Warranty Claims",
] as const;

// Confirmed from the "Source" dropdown on web + real data.
export const LEAD_SOURCE_OPTIONS = ["Website", "Call", "WhatsApp", "Instagram", "Email"] as const;

// Confirmed from the "Lead Priority" dropdown on web + real data.
export const LEAD_PRIORITY_OPTIONS = ["Hot", "Warm", "Cold"] as const;

// Confirmed from real data: "Neo Wheels", "Zetta Alloys", "Other" all seen
// as actual brand_interest values across multiple records.
export const BRAND_INTEREST_OPTIONS = ["Neo Wheels", "Zetta Alloys", "Other"] as const;

// Standard Indian states + union territories. Static reference data.
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