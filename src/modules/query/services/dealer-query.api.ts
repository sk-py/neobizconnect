import { api } from "@/services/axios";
import { CreateQueryPayload, DealerQuery, UpdateQueryPayload } from "../types";

export const fetchDealerQueries = async (): Promise<DealerQuery[]> => {
  const res = await api.get(`/Dealer/User/leadlist`);


  return res.data.flatMap((item: any) =>
    (item.formJson || []).map((form: any) => ({
      id: item.id,
      createdDate: item.createdDate,
      ...form,
    })),
  );
};


export const createDealerQuery = async (
  groupCompanyName: string,
  payload: CreateQueryPayload,
) => {
  const res = await api.post(`/${groupCompanyName}/Dealer/User/leaddetails`, {
    formJson: [payload],
    id: 0,
  });
  return res.data;
};

export const updateDealerQuery = async (
  groupCompanyName: string,
  originalRecord: DealerQuery,
  updates: Partial<CreateQueryPayload>,
) => {
  const { id, createdDate, ...originalForm } = originalRecord as any;
  const mergedForm = { ...originalForm, ...updates };

  const res = await api.post(`/Update/${groupCompanyName}/Dealer/User/leaddetails`, {
    formJson: [mergedForm],
    id,
  });
  return res.data;
};