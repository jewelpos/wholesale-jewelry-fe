export type SalesInvoiceListType = {
  invoicenumber: number;
  customerid: string;
  companyname: string;
  saledate: string;
  salemodeid: number | null;
  salemodename: string;
  numberofitems: number;
  totalamount: number;
  discountamount: number;
  subtotal: number;
  salestax: number;
  shipping: number;
  netamount: number;
  amountreceived: number;
  balancedue: number;
  termsname: string;
  warehousename: string;
  warehouseid: number;
  outletid: number;
  createdbyid: string;
  registerno: string;
  isweborder: boolean;
  invsalesorder: boolean;
  voiddate: string;
  lastmodifiedbyid: string;
  lastmodifieddate: string;
  statusname: string;
  custcrediapplied: number | null;
};

export type SalesInvoiceListResponseType = {
  total: number;
  data: SalesInvoiceListType[];
};

export type SalesOrderListType = {
  customerid: number;
  custcompanyname: string;
  salesorderno: string;
  orderdate: string;
  numberofitems: number;
  netamount: number;
  termsname: string;
  invshippingmethod: string;
  shippingname: string;
  warehousename: string;
  statusname: string;
  createdbyid: number;
  createdbyname: string;
  registerno: string;
  orderprocesseddate: string;
  orderprocessedbyid: number;
  orderprocessedbyname: string;
  warehouseid: number;
  outletid: number;
  invoicepcs: number;
  invoiceqty: number;
  bordpcs: number;
  bordqty: number;
};

export type SalesOrderListResponseType = {
  total: number;
  data: SalesOrderListType[];
};

export type MemoSummary = {
  memonumber: number;
  customerid: number;
  companyname: string;
  saledate: string;
  salemodename: string;
  numberofitems: number;
  totalamount: number;
  discountamount: number;
  subtotal: number;
  salestax: number;
  shipping: number;
  netamount: number;
  amountreceived: number;
  balancedue: number;
  termsname: string;
  warehousename: string;
  warehouseid: number;
  outletid: number;
  createby: string;
  registerno: string;
  isweborder: number;
  invsalesorder: number;
  voiddate: string;
  lastmodifiedby: string;
  lastmodifieddate: string;
  statusname: string;
  custcrediapplied: number | null;
};

export type MemoSummaryTotals = {
  totalamount: number;
  subtotal: number;
  netamount: number;
  amountreceived: number;
  balancedue: number;
};

export type MemoSummaryResponse = {
  total: number;
  data: MemoSummary[];
  totalsRow: MemoSummaryTotals;
};
