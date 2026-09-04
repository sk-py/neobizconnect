export type ItemMasterEntry = {
  itemCode: string;
  itemName: string;
  brand: string;
  wheelSize: string;
  offerPrice: number;
  offerLastDate: string | null;
  inStockQty: number;
  totalProdOrderQty: number;
  firstPoDueDate: string | null;
  attachment: string;
  offerItem: boolean;
};

export type ItemMasterBrand = "NEO" | "ZETTA";