import { gql } from "@apollo/client";

export const GET_EXPENSE_LIST_QUERY = gql`
  query GetExpenseList($outletid: Int!, $page: Int!, $perpage: Int!) {
    getExpenseList(outletid: $outletid, page: $page, perpage: $perpage) {
      total
      data {
        expenseid
        expensedate
        accountdescription
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
