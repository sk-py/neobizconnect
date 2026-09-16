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

// Confirmed against the real /Neo/Invoice/List/Pagenation response
// (DevTools Network tab, 2026-09-15). The endpoint wraps its array in
// { content: [...] } along with pagination metadata.
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
  // Confirmed via DevTools: this is the DocEntry value the
  // POST /Neo/SAP/InvoicePDF endpoint expects as { DocEntry: string }.
  invoice_doc_entry: string;
  items: ArInvoiceLineItem[];
};

// Wraps the raw /Pagenation response so the screen can drive page controls.
export type ArInvoicePage = {
  content: ArInvoice[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  isLast: boolean;
  size: number;
};

// Confirmed against the real /Neo/SalesOrder/List response
// (console log, 2026-09-16). Note: doc_status and portal_status can
// disagree (e.g. doc_status "Open" vs portal_status "Pending") - the web
// UI displays portal_status, so that's the one to prefer for the badge.
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

// Confirmed via console log, 2026-09-16: /Neo/PerformaInvoice/List returns
// records structurally identical to PendingOrder (same field names, same
// item shape). The only functional difference is portal_status is a fixed
// document-type label here ("PI(Performa Invoice)"), not a workflow state.
export type ProformaInvoice = PendingOrder;

// Confirmed via console log, 2026-09-16: /Neo/ARCreditMemo/List returns
// records structurally identical to ArInvoice (same field names, same
// item shape), except the status field is a plain top-level "status" key
// rather than "invoice_status", and there's no invoice_doc_entry (no PDF
// endpoint confirmed for credit memos).
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