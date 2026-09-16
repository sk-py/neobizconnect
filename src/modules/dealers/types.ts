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

export type ArInvoiceLineItem = {
  HSN: string;
  ItemNo: string;
  LineNo: string;
  TaxCode: string;
  Discount: string;
  Quantity: string;
  LineTotal: string;
  TaxAmount: string;
  UnitPrice: string;
  Warehouse: string;
  ItemDescription: string;
};

export type ArInvoice = {
  id: number;
  customer_name: string;
  customer_code: string;
  contact_person: string;
  customer_ref_no: string;
  branch: string;
  invoice_number: string;
  invoice_status: string;
  posting_date: string;
  due_date: string;
  document_date: string;
  sales_manager: string;
  remarks: string;
  payment_terms: string;
  ship_to: string;
  ship_to_address: string;
  bill_to: string;
  bill_to_address: string;
  gstin: string;
  pan_no: string;
  eway_bill_no: string;
  irn_no: string;
  ack_no: string;
  ack_date: string;
  freight: string;
  round_off: string;
  doc_total: string;
  items_quantity: number;
  lrno: string;
  lr_date: string;
  transport_name: string;
  invoice_doc_entry: string;
  items: ArInvoiceLineItem[];
};

export type ArInvoicePage = {
  content: ArInvoice[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  isLast: boolean;
  size: number;
};

export type PendingOrderLineItem = {
  HSN: string;
  Price: number;
  LineNo: number;
  TaxCode: string;
  Discount: number;
  ItemCode: string;
  Quantity: number;
  Warehouse: string;
  ItemDescription: string;
};

export type PendingOrder = {
  id: number;
  salesorderno: number;
  customer_name: string;
  customer_code: string;
  contact_person: string;
  customer_ref_no: string;
  branch: string;
  doc_status: string;
  posting_date: string;
  delivery_date: string;
  document_date: string;
  sales_manager: string;
  remarks: string;
  payment_terms: string;
  ship_to: string;
  ship_to_address: string;
  bill_to: string;
  bill_to_address: string;
  gstin: string;
  pan_no: string;
  doc_total: string;
  portal_status: string;
  create_dt: string;
  update_dt: string;
  items: PendingOrderLineItem[];
};

export type ProformaInvoice = PendingOrder;

export type ArCreditMemo = {
  id: number;
  customer_name: string;
  customer_code: string;
  contact_person: string;
  customer_ref_no: string;
  branch: string;
  arcreditmemono: string;
  arcreditmemodocentry: string;
  posting_date: string;
  due_date: string;
  document_date: string;
  sales_manager: string;
  remarks: string;
  payment_terms: string;
  ship_to: string;
  ship_to_address: string;
  bill_to: string;
  bill_to_address: string;
  gstin: string;
  pan_no: string;
  eway_bill_no: string;
  irn_no: string;
  ack_no: string;
  ack_date: string;
  freight: string;
  round_off: string;
  doc_total: string;
  items_quantity: number;
  month_name: string;
  financial_year: string;
  create_dt: string;
  update_dt: string;
  items: ArInvoiceLineItem[];
  status: string;
};

export type LedgerEntry = {
  Origin: string;
  OriginDocEntry: string;
  Ref3: string;
  OriginNo: string;
  CreditLC: number;
  OffsetAccount: string;
  Details: string;
  DebitLC: number;
  PostingDate: string;
  CumulativeBalanceLC: number;
  Branch: string;
  Ref1: string;
  Ref2: string;
  BalanceDueLC: number;
};

export type LedgerResponse = {
  TotalDebitLC: number;
  CardName: string;
  TotalCumulativeBalanceLC: number;
  AccountBalance: LedgerEntry[];
  CardCode: string;
  AccBalance: string;
  TotalBalanceDueLC: number;
  TotalCreditLC: number;
};