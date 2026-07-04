import { gql } from "@apollo/client";

export const GET_EXPENSE_LIST_QUERY = gql`
  query GetExpenseList(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getExpenseList(
      outletid: $outletid
      page: $page
      perpage: $perpage
      filters: $filters
      sortModel: $sortModel
      rowGroupCols: $rowGroupCols
      groupKeys: $groupKeys
    ) {
      total
      data {
        expenseid
        expensedate
        accountdescription
        expensecodeid
        expensedetail
        expenseamount
        expensemode
        createdby
        expensenotes
        expensechknumber
        warehousename
        warehouseid
        outletid
        modifiedby
        lastmodifieddate
        approvalstatus
        approvedbyid
        approveddate
      }
    }
  }
`;

export const GET_EXPENSE_DAILY_SUMMARY_QUERY = gql`
  query GetExpenseDailySummary($outletid: Int!) {
    getExpenseDailySummary(outletid: $outletid) {
      total_today
      paid_today
      pending_today
      voided_today
      revenue_today
      avg_today
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

export const GET_PAYMENT_COLLECTION_MATRIX_QUERY = gql`
  query GetPaymentCollectionMatrix(
    $storeid: Int!
    $outletids: [Int!]!
    $startdate: String!
    $enddate: String!
  ) {
    getPaymentCollectionMatrix(
      storeid: $storeid
      outletids: $outletids
      startdate: $startdate
      enddate: $enddate
    ) {
      columns {
        outletid
        outletname
      }
      data {
        paymentmode
        paymentmodename
        outlets {
          outletid
          totalamount
          paycount
          avgamount
        }
      }
      totals {
        outletid
        totalamount
        paycount
        avgamount
      }
    }
  }
`;
