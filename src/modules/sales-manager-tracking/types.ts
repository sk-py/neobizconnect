export type TransportMode =
  | "Train"
  | "Bus"
  | "Auto"
  | "Walking"
  | "Car (Personal)"
  | "Bike (Personal)"
  | "Other";

export type Dealer = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
};

export type ActiveVisit = {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerAddress: string;
  startTime: string;
};

export type CompletedVisit = ActiveVisit & {
  endTime: string;
  reason: string;
  conclusion: string;
  remarks: string;
  futureProspects: string;
};

export type LiveLocationPayload = {
  latitude: string;
  longitude: string;
  locationDate: string;
  locationTime: string;
  data_json: Array<{
    accuracy?: number;
    speed?: number;
    battery?: number;
    transportMode?: TransportMode;
    activeVisitId?: string | null;
  }>;
};

export interface ExistingDistributor {
  shop_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
}

export interface NearbyDistributorItem {
  visit_location: {
    id: number;
    shop_name: string;
    shop_type: string;
    latitude: string;
    longitude: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstin: string;
    created_at?: string;
    updated_at?: string;
    update_user_id?: number;
  };
  distance: string;
}

export interface AddDistributorLocationPayload {
  latitude: string;
  longitude: string;
  shop_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
}

export interface AddDistributorLocationResponse {
  id: number;
  shop_name: string;
  shop_type: string;
  latitude: string;
  longitude: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  created_at: string;
  updated_at: string;
  update_user_id: number;
}
