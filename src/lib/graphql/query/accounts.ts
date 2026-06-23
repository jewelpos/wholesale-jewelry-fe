import { gql } from "@apollo/client";

export const GET_EXPENSE_LIST_QUERY = gql`
  query GetExpenseList($outletid: Int!, $page: Int!, $perpage: Int!) {
    getExpenseList(outletid: $outletid, page: $page, perpage: $perpage) {
      total
      data {
        expenseid
        expensedate
        accountdescription
        expensecodeid
        expensedetail
        expenseamount
        expensemode
        expensepaidbyid
        expensenotes
        expensechknumber
        warehousename
        warehouseid
        outletid
        lastmodifiedbyid
        lastmodifieddate
      }
    }
  }
`;

export const GET_EXPENSE_CODE_QUERY = gql`
  query GetExpenseCode($storeid: Int!) {
    getExpenseCode(storeid: $storeid) {
      expensecode
      accountdescription
      accounttype
    }
  }
`;

export const GET_PAYMENT_EXPENSE_MODES_QUERY = gql`
  query GetPaymentExpenseModes($storeid: Int!) {
    getPaymentExpenseModes(storeid: $storeid) {
      paymentmodeid
      paymode
      paymodedescription
    }
  }
`;

export const GET_BANK_LIST_QUERY = gql`
  query GetBanksList($storeId: Int!, $page: Int!, $perpage: Int!) {
    getBanksList(storeid: $storeId, page: $page, perpage: $perpage) {
      total
      data {
        bankid
        bankname
        created_at
      }
    }
  }
`;
