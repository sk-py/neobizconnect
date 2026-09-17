import { api } from "@/services/axios";
import { CreateQueryPayload, DealerQuery, UpdateQueryPayload } from "../types";

export const fetchDealerQueries = async (): Promise<DealerQuery[]> => {
  const res = await api.get(`/Dealer/User/leadlist`);

  // Replicating the web code's specific extraction logic
  return res.data.flatMap((item: any) =>
    (item.formJson || []).map((form: any) => ({
      id: item.id,
      ...form,
    })),
  );
};

// The GET above unwraps { id, formJson: [{...}] } records, so create/update
// must send that same formJson wrapper back. And unlike Lead/Query and
// Online Lead (a different endpoint family that scopes by numeric
// companyid in the body), this "Dealer" family scopes by groupCompanyName
// embedded in the URL path itself — matching every sibling dealer-facing
// endpoint in this codebase (sub-dealers-api.ts, profile.api.ts,
// dashboard.api.ts, etc.). The prior 500 was this path segment missing.
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
  payload: UpdateQueryPayload,
) => {
  const { id, ...form } = payload;
  const res = await api.post(`/Update/${groupCompanyName}/Dealer/User/leaddetails`, {
    formJson: [form],
    id,
  });
  return res.data;
};