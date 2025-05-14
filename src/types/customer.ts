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
  transactionno: string;
  custcompanyname: string;
  paymentdate: Date;
  invoiceno: string;
  paymode: string;
  checkcardno: string;
  amountpaid: number;
  paymentstatus: string;
  appliedby: string;
  paymentreference: string;
  customerid: string;
  bankname: string;
  warehousename: string;
  warehouseid: number;
  outletid: number;
  dateofentry: Date;
  voidpayment: boolean;
  customerpaymentid: number;
  lastmodifieddate: Date;
};

export type CustomerPaymentListResponseType = {
  total: number;
  data: CustomerPaymentListType[];
};

export type CustomersListType = {
  customerid: string;
  custcompanyname: string;
  fullname: string;
  custcity: string;
  phone: string;
  lastsaledate: string;
  lastpaymentdate: string;
  days_since_last_sale: number;
  numberofsales: number;
  balancedue: number;
  totalsale: number;
  opencredit: number;
  mobile: string;
  custregistrationdate: string;
  custemailadd: string;
  warehousename: string;
  warehouseid: number;
  outletid: number;
};

export type CustomersListResponseType = {
  total: number;
  data: CustomersListType[];
};

export type CustomerFormType = {
  customerid?: string;
  custcompanyname: string;
  custadd1: string;
  custcity: string;
  custstate: string;
  custzip: string;
  custcountry: string;
  custphone1: string;
  custcell: string;
  custemailadd: string;
  custfname: string;
  custlname: string;
  custphone2: string;
  storeid: number;
  warehouseid: string;
  custdiscount: number;
  custcreditlimit: number;
  termsid: number;
  custshippingmethod: string;
  custbillto: string;
  custshipto: string;
  custtaxid: string;
  custsalestax: number;
  status: number;
  custremarks: string;
  custalertremarks: string;
  custphotopath: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  file: any;
  custalert: number;
};
