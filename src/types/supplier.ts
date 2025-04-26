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
  termsname: number;
  phone: number;
  cellphone: number;
  emailaddress: string;
  webaddress: number;
  shippimgmethod: string;
  discountrate: number;
  warehousename: string;
  address1: string;
  address2: string;
  state: string;
  zipcode: string;
  country: string;
  phone2: string;
  supplierstatus: string;
  remarks: string;
  warehouseid: number;
  outletid: number;
  createdbyid: number;
  createddate: string;
  lastmodifiedbyid: number;
  lastmodifieddate: string;
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
  supplierid: number;
  veninvoiceno: string;
  veninvoicedate: string
  veninvoicetotal: number;
  veninvamtpaid: number;
  veninvamtbalance: number;
  refponumber: number;
  invpostingdate: string
  veninvremarks: string;
  warehouseid: number;
  veninvbankid: number;
  enteredbyid: number;
  termsid: number;
  venpostchkamount: number;
  venpostchkamountdue: number;
  vencrediapplied: number;
  lastmodifiedbyid: number;
  lastmodifieddate: string
  warehousename: string;
  suppliername: string;
  termsname: string;
  enteredbyname: string;
};

export type SupplierInvoiceResponseType = {
  total: number;
  data: SupplierInvoiceType[];
};

export type SupplierInvoiceFormType = {
  warehouseid: string;
  supplierid: string;
  veninvoiceno: string;
  refponumber: number;
  veninvoicedate: string;
  invpostingdate: string;
  termsid: number;
  storeid: number;
};