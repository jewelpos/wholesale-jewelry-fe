export type AccountsExpenseListType = {
  expenseid: number;
  expensedate: string;
  accountdescription: string;
  expensecodeid: number;
  expensedetail: string;
  expenseamount: number;
  expensemode: string;
  createdby: string;
  expensenotes: string;
  expensechknumber: string;
  warehousename: string;
  warehouseid: number;
  outletid: number;
  modifiedby: string;
  lastmodifieddate: string;
  approvalstatus: string;
  approvedbyid: number;
  approveddate: string;
};

export type AccountsExpenseListResponseType = {
  total: number;
  data: AccountsExpenseListType[];
};

export type AccountsBankListType = {
  bankid: number;
  bankname: string;
  created_at: string;
};

export type AccountsBankListResponseType = {
  total: number;
  data: AccountsBankListType[];
};

export type PaymentMatrixOutletQty = {
  outletid: number;
  totalamount: number;
  paycount: number;
  avgamount: number;
};

export type PaymentMatrixRow = {
  paymentmode: string;
  paymentmodename: string;
  outlets: PaymentMatrixOutletQty[];
};

export type PaymentMatrixColumn = {
  outletid: number;
  outletname: string;
};

export type PaymentMatrixTotals = {
  outletid: number;
  totalamount: number;
  paycount: number;
  avgamount: number;
};

export type PaymentMatrixResponse = {
  columns: PaymentMatrixColumn[];
  data: PaymentMatrixRow[];
  totals: PaymentMatrixTotals[];
};

export type PaymentMetricMode = "totalamount" | "paycount" | "avgamount";

export type SalesMatrixOutletData = {
  outletid: number;
  totalsales: number;
  salecount: number;
  avgsale: number;
  amountreceived?: number;
  balancedue?: number;
};

export type SalesMatrixRow = {
  period_key: string;
  period_label: string;
  outlets: SalesMatrixOutletData[];
};

export type SalesMatrixColumn = {
  outletid: number;
  outletname: string;
};

export type SalesMatrixTotals = {
  outletid: number;
  outletname: string;
  totalsales: number;
  salecount: number;
  avgsale: number;
  amountreceived?: number;
  balancedue?: number;
};

export type SalesMatrixResponse = {
  columns: SalesMatrixColumn[];
  data: SalesMatrixRow[];
  totals: SalesMatrixTotals[];
};

export type SalesMetricMode = "totalsales" | "salecount" | "avgsale";
