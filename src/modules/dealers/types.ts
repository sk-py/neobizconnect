export type DealerAddress = {
  City: string;
  Block: string;
  GSTIN: string;
  State: string;
  RowNum: number;
  Street: string;
  Address: string;
  Country: string;
  ZipCode: string;
  StreetNo: string;
  AdresType: string;
  BuildingFloorRoom: string;
};

export type Dealer = {
  id: number;
  cardCode: string;
  cardName: string;
  emailAddress: string;
  phone1: string;
  phone2: string;
  contactPerson: string;
  salesManager: string;
  salesManagerCode: string;
  creditLimit: string;
  portalStatus: string;
  brand_type: string[] | null;
  lock_status: number | null;
  bpaddresses: DealerAddress[];
};