import { api } from "@/services/axios";
import {
    AddDistributorLocationPayload,
    AddDistributorLocationResponse,
    ExistingDistributor,
    NearbyDistributorItem,
} from "../types";

export const distributorService = {
  getNearbyDistributors: async (coords: {
    latitude: string;
    longitude: string;
  }): Promise<NearbyDistributorItem[]> => {
    const response = await api.post<NearbyDistributorItem[]>(
      "/Visit/Location/Get",
      coords,
    );
    return response.data;
  },

  getExistingDistributors: async (): Promise<ExistingDistributor[]> => {
    const response = await api.get<ExistingDistributor[]>("/Neo/Customer/List");
    return response.data;
  },

  saveDistributorLocation: async (
    payload: AddDistributorLocationPayload,
  ): Promise<AddDistributorLocationResponse> => {
    const response = await api.post<AddDistributorLocationResponse>(
      "/Add/Visit/Location/Save",
      payload,
    );
    return response.data;
  },
};
