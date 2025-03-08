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
