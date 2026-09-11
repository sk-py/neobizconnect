import { COUNTRY_CODES, splitPhoneNumber } from "@/constants/country-codes";
import type { CountryCode } from "@/constants/country-codes";
import { INDIAN_STATES } from "@/constants/indian-states";

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
  account_owner?: string;
  account_owner_id?: string | number;
};

export type OnlineLead = {
  id: number;
  companyid: number;
  formJson: OnlineLeadFormData[];
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

export const TYPE_OF_QUERY_OPTIONS = [
  "New Alloy Set",
  "Single Wheel",
  "Cap",
  "Dealership",
  "Warranty Claim",
] as const;

export const BRAND_INTEREST_OPTIONS = ["Neo", "Zetta", "Other"] as const;
export const LEAD_SOURCE_OPTIONS = ["Website", "Call", "WhatsApp", "Instagram", "Email"] as const;
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

export { COUNTRY_CODES, splitPhoneNumber, INDIAN_STATES };
export type { CountryCode };