import dayjs from "dayjs";

export type SupplierLedgerListType = {
  supplierid: number;
  ledgerdate: string;
  ledgerid: number;
  ledgercode: string;
  ledgerdescription: string;
  ledamountdebit: number;
  ledamountcredit: number;
  running_balance: number;
  ledgerreference: string;
  ledgerbankid: number;
  warehousename: string;
  warehouseid: number;
  outletid: number;
};

export type SupplierLedgerListResponseType = {
  total: number;
  data: SupplierLedgerListType[];
};

export type SupplierListType = {
  supplierid: number;
  companyname: string;
  contactname: string;
  city: string;
  accountno: string;
  termsname: string;
  phone1: string;
  cellphone: string;
  emailaddress: string;
  webaddress: string;
  shippimgmethod: string;
  discountrate: number;
  warehousename: string;
  address1: string;
  address2: string;
  state: string;
  zipcode: string;
  country: string;
  phone2: string;
  supplierstatus: number;
  remarks: string;
  warehouseid: number;
  outletid: number;
  createdbyid: number;
  createddate: string;
  createdby: string;
  lastmodifiedbyid: number;
  modifiedby: string;
  lastmodifieddate: string;
  lastpurchasedate: string;
  lastpaymentdate: string;
  days_since_last_purchase: number;
  numberofpurchase: number;
  balancedue: number;
  totalpurchase: number;
  opencredit: number;
  totalsalevalue: number;
  postchkamount: number;
};

export type SupplierListResponseType = {
  total: number;
  data: SupplierListType[];
};

export type SupplierFormType = {
  companyname: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  contactperson1: string;
  phone1: string;
  phone2: string;
  cellphone: string;
  emailaddress: string;
  webaddress: string;
  shippimgmethod: string;
  termsid: number;
  accountno: string;
  discountrate: number;
  supplierstatus: number;
  remarks: string;
  warehouseid: string;
  supplierfname: string;
  supplierlname: string;
  storeid: number;
  supplierid?: string;
};

export type SupplierInvoiceType = {
  supplierinvoiceid: number;
  companyname: string;
  veninvoiceno: string;
  veninvoicedate: string;
  veninvoicetotal: number;
  veninvamtpaid: number;
  veninvamtbalance: number;
  terms: string;
  refponumber: string;
  invpostingdate: string;
  veninvremarks: string;
  warehousename: string;
  enteredby: string;
  modifiedby: string;
  lastmodifieddate: string;
  warehouseid: number;
  outletid: number;
};

export type SupplierInvoiceResponseType = {
  total: number;
  data: SupplierInvoiceType[];
};

export type SupplierInvoiceFormType = {
  warehouseid: string;
  supplierid: string;
  veninvoiceno: string;
  refponumber: string;
  veninvoicedate: dayjs.Dayjs;
  termsid: number;
  storeid: number;
  veninvoicetotal: string;
  supplierinvoiceid?: number;
};

export type SupplierType = {
  supplierid: number;
  companyname: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  contactperson1?: string;
  phone1?: string;
  phone2?: string;
  cellphone?: string;
  emailaddress?: string;
  webaddress?: string;
  shippimgmethod?: string; 
  termsid?: number;
  accountno?: string;
  discountrate?: number;
  supplierstatus?: number;
  remarks?: string;
  warehouseid?: number;
  supplierfname?: string;
  supplierlname?: string;
};

export type SupplierPayment = {
  paymentid: number;
  companyname: string;
  postingdate: string;
  reference: string;
  paymode: string;
  checkcardno: string;
  chk_description: string;
  amountpaid: number;
  checkstatus: string;
  appliedby: string;
  supplierid: number;
  bankname: string;
  warehousename: string;
  warehouseid: number;
  voided: string;
  username: string;
  lastmodifieddate: string;
};

export type SupplierPaymentResponseType = {
  total: number;
  data: SupplierPayment[];
};

export type AppliedPaymentType = {
  appliedamountid: number;
  supplierpaymentid: number;
  paymode: string;
  appliedamount: number;
  invoicenumber: string;
  applieddate: string;
  checkcardno: string;
  appliedby: string;
  voided: string;
  creditinvoice: string;
  warehousename: string;
  chk_description: string;
  companyname: string;
  lastmodifieddate: string;
  supplierid: number;
  warehouseid: number;
};

export type AppliedPaymentResponseType = {
  total: number;
  data: AppliedPaymentType[];
};

export type NewPaymentFormType = {
  supplierid: number,
  postingdate: dayjs.Dayjs,
  paymentmodeid: number,
  checkcardno: string,
  amount: string,
  invoicenumber: string,
  reference: string 
}

export type CreditAdjustmentFormType = {
  supplierid: number;
  postingdate: dayjs.Dayjs;
  paymentmodeid: number;
  checkcardno: string;
  amount: string;
  invoicenumber: string;
  reference: string;
};

// Credit application types
export type SupplierCreditApplyInvoice = {
  supplierinvoiceid: number;
  supplierid: number;
  veninvoiceno: string;
  veninvoicedate: string;
  veninvoicetotal: number;
  veninvamtpaid: number;
  veninvamtbalance: number;
  warehouseid: number;
  isCreditInvoice: boolean;
};

export type SupplierCreditInfo = {
  hasCredit: boolean;
  creditAvailable: number;
  creditInvoices: SupplierCreditApplyInvoice[];
  balanceDueInvoices: SupplierCreditApplyInvoice[];
};

export type CreditApplicationInput = {
  storeid: number;
  supplierid: number;
  outletid: number;
  postingdate?: string;
  creditInvoiceNumber: string;
  amountToApply?: number;
  targetInvoiceNumbers?: string[];
  reference?: string;
};

export type SupplierBalanceDueType = {
  supplierinvoiceid: number;
  supplierid: number;
  veninvoiceno: string;
  veninvoicedate: string;
  veninvoicetotal: number;
  veninvamtpaid: number;
  veninvamtbalance: number;
  warehouseid: number;
}

export type VoidPaymentFormType = {
  supplierid: number,
  postingdate: dayjs.Dayjs,
  paymentid: number,
}

export type OnHandChequeSummaryType = {
  supplierid: string;
  companyname: string;
  year: number;
  total_amount: number;
  total_checks: string;
  jan: string;
  feb: string;
  mar: string;
  apr: string;
  may: string;
  jun: string;
  jul: string;
  aug: string;
  sep: string;
  oct: string;
  nov: string;
  dec: string;
  warehousename: string;
  warehouseid: number;
  outletid: number;
}

export type OnHandChequeSummaryResponseType = {
  total: number;
  data: OnHandChequeSummaryType[];
}