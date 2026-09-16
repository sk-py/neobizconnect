import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { distributorService } from "../services/distributor.service";
import { fetchCurrentLocation } from "../store/tracking.store";
import { AddDistributorLocationPayload, ExistingDistributor } from "../types";

export const DISTRIBUTORS_QUERY_KEY = ["distributors", "existing"];
export const NEARBY_QUERY_KEY = ["distributors", "nearby"];

export const useExistingDistributors = () => {
  return useQuery<ExistingDistributor[]>({
    queryKey: DISTRIBUTORS_QUERY_KEY,
    queryFn: distributorService.getExistingDistributors,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

export const useAddDistributorLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      formData: Omit<AddDistributorLocationPayload, "latitude" | "longitude">,
    ) => {
      const loc = await fetchCurrentLocation();
      const payload: AddDistributorLocationPayload = {
        latitude: loc.coords.latitude.toFixed(6),
        longitude: loc.coords.longitude.toFixed(6),
        ...formData,
      };
      return distributorService.saveDistributorLocation(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NEARBY_QUERY_KEY });
    },
  });
};
