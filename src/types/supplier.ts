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

export type SupplierListResponseType = {
  total: number;
  data: SupplierListType[];
};
