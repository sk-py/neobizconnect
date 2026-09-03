import { api } from "@/services/axios";//api is your configured Axios instance.
import {
  OrderPayload,
  ProductQueryParams,
  SapProduct,
  UserProfileResponse,
} from "../types";
// They tell the code what kind of data is expected.

// For example:

// ProductQueryParams → parameters used to search/filter products
// SapProduct → structure of a product returned by API
// OrderPayload → structure of data sent when creating an order
// UserProfileResponse → structure of user profile response

export const fetchDealerProducts = async ({
  groupCompanyName,
  brand,
  stockType,
  wheelSize,
}: ProductQueryParams): Promise<SapProduct[]> => {
  const params: Record<string, string | boolean> = {
    brand,
  };
  //Get products from the backend.
  //After the API call finishes, it will return an array of products.


  //Filter apply kiya 
  if (stockType === "inStock") {
    params.inStock = true;
  } else if (stockType === "outOfStock") {
    params.inStock = false;
  } else if (stockType === "offerPrice") {
    params.offerItem = true;
  }
//"Give me products matching this filter."


// If the user selected a specific wheel size, it adds that to the API request.

// If the user selected "all", it doesn't send wheelSize
  if (wheelSize && wheelSize !== "all") {
    params.wheelSize = wheelSize;
  }



  //This is the actual API call
  const endpoint = `/Neo/sap-items/dealer`;
  const response = await api.get<SapProduct[]>(endpoint, { params });
  return response.data;
};


//This function gets the dealer/user profile.
export const fetchUserProfile = async (
  groupCompanyName: string,
): Promise<UserProfileResponse> => {
  const response = await api.get(`/${groupCompanyName}/Dealer/User/profile`);
  return response.data;
};


//This function is used when the user actually places/submits an order.
export const submitSalesOrder = async (payload: OrderPayload) => {
  const response = await api.post(`/Sap/Add/Sales/Order`, payload);
  return response.data;
};
//Server ye request receive karta hai, apne database (SAP ERP system) se products dhundta hai, 
// aur JSON data wapas bhejta hai — jaise:
// [
//   { "id": 1, "itemName": "Alloy Wheel X1", "price": 5000, "inStockQty": 20, ... },
//   { "id": 2, "itemName": "Alloy Wheel X2", "price": 6500, "inStockQty": 5, ... }
// ]

// The 3 main APIs iss file mai 
// Function	Purpose	Method
// fetchDealerProducts()	Get products	GET
// fetchUserProfile()	Get dealer/user profile	GET
// submitSalesOrder()	Create/submit order	POST