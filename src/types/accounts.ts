export type AccountsExpenseListType = {
  expenseid: number;
  expensedate: string;
  accountdescription: string;
  expensedetail: string;
  expenseamount: number;
  expensemode: string;
  expensepaidbyid: number;
  expensenotes: string;
  expensechknumber: string;
  warehousename: string;
  warehouseid: number;
  outletid: number;
  lastmodifiedbyid: number;
  lastmodifieddate: string;
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
