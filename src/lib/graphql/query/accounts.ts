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
