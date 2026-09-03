//Layer 2 — React Query mein wrap karna
import { BrandType, useAuthStore } from "@/store/auth.store";
import { useQuery } from "@tanstack/react-query";
import { fetchDealerProducts } from "../services/products.api";
import { ProductQueryParams, StockFilterType } from "../types";

interface UseDealerProductsProps {
  stockType: StockFilterType;
  wheelSize?: string;
  brand: BrandType;
}


//This creates a custom hook called: stocktype ,wheelsize,brand 
export const useDealerProducts = ({
  stockType,
  wheelSize,
  brand,
}: UseDealerProductsProps) => {
  const user = useAuthStore((state) => state.user);
  //This gets the current user from the authentication store.
  const groupCompanyName = user?.group_company_name.toUpperCase() || "";
  //same company ka name
  //?. means:
// If user exists, get group_company_name; otherwise don't crash.
  const brandName = brand?.toUpperCase();

//Query parameter create kiya 
  const queryParams: ProductQueryParams = {
    groupCompanyName,
    brand: brandName,
    stockType,
    wheelSize,
  };

  return useQuery({
    queryKey: ["dealer-products", queryParams],//kya data unique hai 
    queryFn: () => fetchDealerProducts(queryParams),//jab data chahiye then use this  func
    enabled: Boolean(brand), //brand select na ho tbbtk dont fetch api
    staleTime: 1000 * 60 * 2,//cache free ke liye for 2 mins 
  });
};
//Layer 1 wale fetchDealerProducts function ko React Query ke through call karta hai:
// useQuery comes from TanStack React Query.
// Its purpose is to manage API data for you.
