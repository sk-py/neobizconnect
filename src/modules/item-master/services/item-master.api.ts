import { api } from "@/services/axios";
import { ItemMasterBrand, ItemMasterEntry } from "../types";

export const fetchItemMasterList = async (
  brand: ItemMasterBrand,
): Promise<ItemMasterEntry[]> => {
  const response = await api.get<ItemMasterEntry[]>(
    `/Neo/sap-items/item-master`,
    { params: { brand } },
  );
  return response.data;
};