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

export const GET_MONTHLY_DAILY_SALES_PIVOT_QUERY = gql`
  query GetMonthlyDailySalesPivot(
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
    getMonthlyDailySalesPivot(
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
        year
        month_display
        monthly_total_sales
        day_01
        day_02
        day_03
        day_04
        day_05
        day_06
        day_07
        day_08
        day_09
        day_10
        day_11
        day_12
        day_13
        day_14
        day_15
        day_16
        day_17
        day_18
        day_19
        day_20
        day_21
        day_22
        day_23
        day_24
        day_25
        day_26
        day_27
        day_28
        day_29
        day_30
        day_31
        warehousename
        warehouseid
        outletid
      }
      totalsRow {
        monthly_total_sales
        day_01
        day_02
        day_03
        day_04
        day_05
        day_06
        day_07
        day_08
        day_09
        day_10
        day_11
        day_12
        day_13
        day_14
        day_15
        day_16
        day_17
        day_18
        day_19
        day_20
        day_21
        day_22
        day_23
        day_24
        day_25
        day_26
        day_27
        day_28
        day_29
        day_30
        day_31
      }
    }
  }
`;

export const GET_MONTHLY_EMPLOYEE_SALES_PIVOT_QUERY = gql`
  query GetMonthlyEmployeeSalesPivot(
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
    getMonthlyEmployeeSalesPivot(
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
        employeename
        year
        total_sales
        total_cost
        total_profit
        profit_margin_percent
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
        total_sales
        total_cost
        total_profit
        profit_margin_percent
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

export const GET_MONTHLY_SALES_PIVOT_QUERY = gql`
  query GetMonthlySalesPivot(
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
    getMonthlySalesPivot(
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
        warehousename
        year
        total_sales
        total_cost
        total_profit
        profit_margin_percent
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
        warehouseid
        outletid
      }
      totalsRow {
        total_sales
        total_cost
        total_profit
        profit_margin_percent
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

export const GET_MONTHLY_SALES_PROFIT_PIVOT_QUERY = gql`
  query GetMonthlySalesProfitPivot(
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
    getMonthlySalesProfitPivot(
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
        warehousename
        year
        total_sales
        total_cost
        total_profit
        profit_margin_percent
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
        warehouseid
        outletid
      }
      totalsRow {
        total_sales
        total_cost
        total_profit
        profit_margin_percent
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

export const GET_SUPPLIER_MONTHLY_PURCHASE_PIVOT_QUERY = gql`
  query GetMonthlySupplierPurchasePivot(
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
    getMonthlySupplierPurchasePivot(
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
        supplier
        year
        total_purchases
        total_purchase_amount
        total_amount_paid
        total_balance_due
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
        supplierid
        warehouseid
        outletid
      }
      totalsRow {
        total_purchases
        total_purchase_amount
        total_amount_paid
        total_balance_due
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

export const GET_INVOICE_PROFIT_SUMMARY_LIST_QUERY = gql`
  query GetInvoiceProfitSummaryList(
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
    getInvoiceProfitSummaryList(
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
        invoicenumber
        customerid
        custcompanyname
        saledate
        salemodename
        totalamount
        discountamount
        subtotal
        salestax
        shipping
        netamount
        amountreceived
        balancedue
        taxablesale
        nontaxablesale
        totalcost
        profit
        profit_margin_percent
        statusname
        termsname
        warehousename
        warehouseid
        outletid
      }
    }
  }
`;

export const GET_INVOICE_PROFIT_ITEM_DETAIL_LIST_QUERY = gql`
  query GetInvoiceProfitItemDetailList(
    $storeid: Int!
    $invoicenumber: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getInvoiceProfitItemDetailList(
      storeid: $storeid
      invoicenumber: $invoicenumber
      page: $page
      perpage: $perpage
      filters: $filters
      sortModel: $sortModel
      rowGroupCols: $rowGroupCols
      groupKeys: $groupKeys
    ) {
      total
      data {
        invoiceitemid
        invoicenumber
        itemcode
        itemdescription
        itemquantity
        unitprice
        extendedprice
        itemcost
        totalcost
        profit
        profit_percent
        itemid
        warehouseid
      }
    }
  }
`;

export const GET_ITEM_SOLD_BY_CATEGORY_PIVOT_QUERY = gql`
  query GetMonthlyItemCategorySalesPivot(
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
    getMonthlyItemCategorySalesPivot(
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
        categoryname
        subcategoryname
        year
        total_quantity
        total_sales
        total_cost
        total_profit
        profit_margin_percent
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
        total_quantity
        total_sales
        total_cost
        total_profit
        profit_margin_percent
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

export const GET_SUPPLIER_MONTHLY_SALES_PIVOT_QUERY = gql`
  query GetMonthlySupplierSalesPivot(
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
    getMonthlySupplierSalesPivot(
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
        supplier
        year
        total_purchase
        total_sales
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
        supplierid
        warehouseid
        outletid
      }
      totalsRow {
        total_purchase
        total_sales
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