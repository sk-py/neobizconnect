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
