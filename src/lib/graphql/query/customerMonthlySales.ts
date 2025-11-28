import { gql } from "@apollo/client";

export const GET_CUSTOMER_MONTHLY_SALES_PIVOT_QUERY = gql`
  query GetMonthlyCustomerSalesPivot(
    $storeid: Int!
    $outletid: Int!
    $warehouseid: Int
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getMonthlyCustomerSalesPivot(
      storeid: $storeid
      outletid: $outletid
      warehouseid: $warehouseid
      page: $page
      perpage: $perpage
      filters: $filters
      sortModel: $sortModel
      rowGroupCols: $rowGroupCols
      groupKeys: $groupKeys
    ) {
      total
      data {
        customerid
        custcompanyname
        year
        invoice_count
        total_sales
        total_balance_due
        total_profit
        jan
        feb
        mar
        apr
        may
        jun
        jul
        aug
        sep
        oct
        nov
        dec
        warehousename
        warehouseid
        outletid
      }
      totalsRow {
        invoice_count
        total_sales
        total_balance_due
        total_profit
        jan
        feb
        mar
        apr
        may
        jun
        jul
        aug
        sep
        oct
        nov
        dec
      }
    }
  }
`;
