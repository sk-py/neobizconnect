export type LeadFormData = {
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
  account_owner_id: number;
  sales_manager_remarks: string;
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
  stage_status_list: any[];
  meeting_list: any[];
};