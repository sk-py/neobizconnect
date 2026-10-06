import { api } from "@/services/axios";
import { SubDealer, SubDealerPayload } from "../types";

export const fetchSubDealers = async (
  groupCompanyName: string,
): Promise<SubDealer[]> => {
  const res = await api.get(`/List/${groupCompanyName}/Sub/Dealer/User`);
  return res.data;
};

export type DealerDropdownItem = { card_code: string; card_name: string };

// Dealer dropdown for Sales Manager (GET .../Neo/Dealer/User/AccountBalenceList)
export const fetchDealerDropdown = async (
  groupCompanyName: string,
): Promise<DealerDropdownItem[]> => {
  const res = await api.get(`/${groupCompanyName}/Dealer/User/AccountBalenceList`);
  const list = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
  return list.map((d: any) => ({
    card_code: d.card_code ?? d.cardCode ?? d.CardCode ?? "",
    card_name: d.card_name ?? d.cardName ?? d.CardName ?? "",
  }));
};

export const fetchSubDealersByCardCode = async (
  groupCompanyName: string,
  cardCode: string,
): Promise<SubDealer[]> => {
  const res = await api.post(
    `/List/${groupCompanyName}/Sub/Dealer/User/By/CardCode`,
    { card_code: cardCode },
  );
  return Array.isArray(res.data) ? res.data : res.data?.content ?? [];
};

export const createSubDealer = async (
  groupCompanyName: string,
  payload: SubDealerPayload,
) => {
  const res = await api.post(
    `/Add/${groupCompanyName}/Sub/Dealer/User`,
    payload,
  );
  return res.data;
};

export const updateSubDealer = async (
  groupCompanyName: string,
  payload: SubDealerPayload,
) => {
  const res = await api.post(
    `/Update/${groupCompanyName}/Sub/Dealer/User`,
    payload,
  );
  return res.data;
};

import {
  TargetQuotaListV2Item,
  TargetQuotaMonth,
  TargetQuotaPayload,
} from "../types";

export const fetchSubDealerTargetsList = async (
  groupCompanyName: string,
  year: string,
  months: string[],
): Promise<TargetQuotaListV2Item[]> => {
  const res = await api.post(
    `/List/${groupCompanyName}/Sub/Dealer/Quota/Filter/V2`,
    {
      year,
      month: months,
    },
  );
  return res.data;
};

export const fetchSingleSubDealerTargetYear = async (
  groupCompanyName: string,
  subDealerId: number,
  year: string,
): Promise<TargetQuotaMonth[]> => {
  const res = await api.post(
    `/List/${groupCompanyName}/Sub/Dealer/Quota/Filter/`,
    {
      neo_subdealer_id: subDealerId,
      year,
    },
  );
  // Assuming the backend returns the array of months directly, or wrap it depending on exact response shape.
  return res.data?.Quota || res.data;
};

export const assignSubDealerTarget = async (
  groupCompanyName: string,
  payload: TargetQuotaPayload,
) => {
  const res = await api.post(
    `/Add/${groupCompanyName}/Sub/Dealer/Quota/By/Year`,
    payload,
  );
  return res.data;
};
