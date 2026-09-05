export type SubDealer = {
  id: number;
  card_code: string;
  shopName: string;
  businessType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNo: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  instagram: string;
  brandsCurrentlySold: string;
  potentialSalesPerMonth: string;
  subDealerStatus: string;
  remarks: string;
  registeredBy: string;
  registrationDateTime: string;
};

export type SubDealerPayload = Omit<SubDealer, "id" | "card_code"> & {
  id?: number;
  card_code?: string;
};

export type TargetQuotaMonth = {
  month: string;
  amount: number;
  quantity: number;
};

export type TargetQuotaPayload = {
  neo_subdealer_id: number;
  year: string;
  Quota: TargetQuotaMonth[];
};

export type TargetQuotaListV2Item = {
  id: number;
  neo_subdealer_id: number;
  year: string;
  card_code: string;
  neo_subdealer_name: string;
  location: string;
  previousMonth_1_name: string;
  previousMonth_1_amount: number;
  previousMonth_1_quantity: number;
  previousMonth_2_name: string;
  previousMonth_2_amount: number;
  previousMonth_2_quantity: number;
  previousMonth_3_name: string;
  previousMonth_3_amount: number;
  previousMonth_3_quantity: number;
};
