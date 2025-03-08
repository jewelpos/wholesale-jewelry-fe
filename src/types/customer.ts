export type CustomerBalanceAgingType = {
  customerid: number;
  customername: string;
  companyname: string;
  total_sale: number;
  due_0_30: number;
  due_31_60: number;
  due_61_90: number;
  due_91_120: number;
  due_120_plus: number;
  total_due: number;
  warehouseid: number;
  outletid: number;
};

export type CustomerBalanceAgingResponseType = {
  total: number;
  data: CustomerBalanceAgingType[];
};

export type CustomerChequeListType = {
  customerid: number;
  checkpostingdate: string;
  checkno: string;
  checkamount: number;
  checkstatus: string;
  checkentrydate: string;
  checkenteredbyid: number;
  customercheckdetailid: number;
  chkinvoiceno: string;
  chkremarks: string;
  chkbankid: number;
  warehousename: string;
  warehouseid: number;
  outletid: number;
  chkhold: boolean;
  chknsf: boolean;
  chkvoid: boolean;
  lastmodifieddate: string;
  lastmodifiedbyid: number;
};

export type CustomerChequeListResponseType = {
  total: number;
  data: CustomerChequeListType[];
};

export type CustomerLedgerReportType = {
  ledgercustid: number;
  ledgerdate: string;
  ledgerid: number;
  ledgercode: string;
  ledgerdescription: string;
  ledamountdebit: number;
  ledamountcredit: number;
  running_balance: number;
  ledgerreference: string;
  ledgerbankid: number;
  warehouseid: number;
  warehousename: string;
  outletid: number;
};

export type CustomerLedgerReportResponseType = {
  total: number;
  data: CustomerLedgerReportType[];
};

export type CustomerBalanceReportType = {
  customerid: number;
  customername: string;
  companyname: string;
  number_of_sale: number;
  last_sale_date: string;
  total_sale: number;
  amount_received: number;
  total_due: number;
  warehouseid: number;
  outletid: number;
};

export type CustomerBalanceReportResponseType = {
  total: number;
  data: CustomerBalanceReportType[];
};

export type CustomerPaymentListType = {
  customerid: number;
  transactionno: string;
  paymentdate: string;
  invoiceno: string;
  paymode: string;
  checkcardno: string;
  amountpaid: number;
  paymentstatus: string;
  appliedbyid: number;
  warehousename: string;
  warehouseid: number;
  outletid: number;
  bankid: number;
  paymentreference: string;
  dateofentry: string;
  voidpayment: boolean;
  customerpaymentid: number;
  lastmodifieddate: string;
};

export type CustomerPaymentListResponseType = {
  total: number;
  data: CustomerPaymentListType[];
};
