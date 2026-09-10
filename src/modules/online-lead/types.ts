// Field names confirmed from an earlier captured CREATE payload (same
// shape used for the GET list — formJson wraps these fields). Note this
// is a GENUINELY DIFFERENT field set/value set than Lead/Query:
// - "lead_status" (not "status")
// - "remark" (singular, not remarks/remarks2)
// - brand_interest values are short ("Neo"/"Zetta"/"Other"), not
//   "Neo Wheels"/"Zetta Alloys" like Lead/Query
export type OnlineLeadFormData = {
  id?: number;
  customer_name: string;
  phone_1: string;
  city: string;
  state: string;
  car_model: string;
  type_of_query: string;
  brand_interest: string;
  product_interest: string;
  source: string;
  lead_status: string;
  remark: string;
  // Not exposed in the edit UI, but present on real records fetched from
  // the API. Kept here (optional) so TypeScript knows about them when
  // they pass through the update merge — see the account_owner_id type
  // bug note in online-lead.api.ts.
  account_owner?: string;
  account_owner_id?: string | number;
};

export type OnlineLead = {
  id: number;
  companyid: number;
  formJson: OnlineLeadFormData[];
  // NOTE: the exact wrapper shape (employeeid, createdDate, etc.) hasn't
  // been independently confirmed for THIS endpoint the way it was for
  // Lead/Query — inferred by pattern. Extra fields pass through untyped.
  [key: string]: any;
};

export type EmployeeOption = {
  id: number;
  name: string;
};

export const EMPTY_ONLINE_LEAD_FORM: OnlineLeadFormData = {
  customer_name: "",
  phone_1: "",
  city: "",
  state: "",
  car_model: "",
  type_of_query: "",
  brand_interest: "",
  product_interest: "",
  source: "",
  lead_status: "",
  remark: "",
};

// Confirmed from the "Type Of Query" dropdown on web — a DIFFERENT list
// than Lead/Query's (no "Exchange with Current Wheels", has "Single
// Wheel"/"Cap" instead).
export const TYPE_OF_QUERY_OPTIONS = [
  "New Alloy Set",
  "Single Wheel",
  "Cap",
  "Dealership",
  "Warranty Claim",
] as const;

// Confirmed from the "Brand Interest" dropdown on web — short names,
// different from Lead/Query's "Neo Wheels"/"Zetta Alloys".
export const BRAND_INTEREST_OPTIONS = ["Neo", "Zetta", "Other"] as const;

// Confirmed from the "Source" dropdown on web.
export const LEAD_SOURCE_OPTIONS = ["Website", "Call", "WhatsApp", "Instagram", "Email"] as const;

// Confirmed from the "Lead Status" dropdown on web — a DIFFERENT list than
// Lead/Query's status options. The dropdown was scrolled and may have more
// options below "Wrong Number" that weren't visible in the screenshot —
// flag with TL if more turn up.
export const LEAD_STATUS_OPTIONS = [
  "Sold Online",
  "Sold Offline",
  "Lost / Not Interested",
  "Design / Finish NA",
  "Given To Manager",
  "Not Responding",
  "In Progress",
  "On Hold",
  "Wrong Number",
  "Price Too High",
  "Price Enquiry",
] as const;


// Moved to a shared location since multiple modules (Lead/Query, Online
// Lead) now use the country-code picker. Re-exported here so existing
// imports from this file keep working.
export { COUNTRY_CODES, splitPhoneNumber } from "@/constants/country-codes";
export type { CountryCode } from "@/constants/country-codes";
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