import { api } from "@/services/axios";

export type DealerTargetAchievement = {
  dealer_name: string;
  dealer_code: string;
  phone_no: string;
  phone_no_2: string;
  email: string;
  sales_manager: string;
  credit_limit: string;
  pending_order_count: number;
  pending_order_amount: string;
  performa_invoice_count: number;
  performa_invoice_amount: string;
  ar_invoice_count: number;
  ar_invoice_amount: string;
  ar_credit_count: number;
  ar_credit_amount: string;
  target_assigned_anount: number;
  achievement_anount: number;
  target_assigned_quantity: number;
  achievement_quantity: number;
};

export const fetchDealerTargetAchievement = async (
  cardCode: string,
): Promise<DealerTargetAchievement> => {
  const res = await api.post(`/Dashboard/Neo/Dealer/User/View`, {
    user_code: cardCode,
  });
  return res.data;
};