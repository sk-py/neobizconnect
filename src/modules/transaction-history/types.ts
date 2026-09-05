export type TransactionDocumentLine = {
  ItemCode: string;
  Quantity: number;
  UnitPrice: number;
  WarehouseCode: string;
};

export type Transaction = {
  id: number;
  cardCode: string;
  card_name: string;
  series: number;
  docDate: string;
  taxDate: string;
  docDueDate: string;
  u_DealerStatus: string;
  comments: string;
  payToCode: string;
  shipToCode: string;
  api_status: string;
  documentLines: TransactionDocumentLine[];
};