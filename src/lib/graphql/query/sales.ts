import { gql } from "@apollo/client";

export const GET_SALES_INVOICE_LIST_QUERY = gql`
  query GetInvoiceList(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getInvoiceList(
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
        invoicenumber
        customerid
        companyname
        saledate
        salemodeid
        salemodename
        numberofitems
        totalamount
        discountamount
        subtotal
        salestax
        shipping
        netamount
        amountreceived
        balancedue
        termsname
        warehousename
        warehouseid
        outletid
        createdby
        registerno
        isweborder
        invsalesorder
        voiddate
        modifiedby
        lastmodifieddate
        statusname
        custcrediapplied
      }
    }
  }
`;

export const GET_MEMO_LIST_QUERY = gql`
  query GetMemoList(
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
    getMemoList(
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
        memonumber
        customerid
        companyname
        saledate
        salemodename
        numberofitems
        totalamount
        discountamount
        subtotal
        salestax
        shipping
        netamount
        amountreceived
        balancedue
        termsname
        warehousename
        warehouseid
        outletid
        createby
        registerno
        isweborder
        invsalesorder
        voiddate
        lastmodifiedby
        lastmodifieddate
        statusname
        custcrediapplied
      }
      totalsRow {
        totalamount
        subtotal
        netamount
        amountreceived
        balancedue
      }
    }
  }
`;

export const GET_SALES_ORDER_QUERY = gql`
  query GetSalesOrder($storeid: Int!, $salesorderno: Float!) {
    getSalesOrder(storeid: $storeid, salesorderno: $salesorderno) {
      salesorderid
      salesorderno
      customerid
      warehouseid
      orderdate
      termsid
      invshippingmethod
      discountpercent
      salestaxrate
      shipping
      netamount
      remarks
      orderedby
      orderstatusid
      invbilltocompanyname
      invbilltoadd1
      invbilltocity
      invbilltostate
      invbilltozip
      invbilltophone
      invshiptocompanyname
      invshiptoadd1
      invshiptocity
      invshiptostate
      invshiptozip
      invshiptophone
      items {
        salesorderitemid
        itemid
        itemcode
        itemdescription
        itemunit
        itempcs
        itemquantity
        unitprice
        discountpercent
        extendedprice
        warehouseid
        invoicepcs
        invoiceqty
        bordpcs
        bordqty
        discountsource
        discountpromotionid
      }
    }
  }
`;

export const GET_INVOICE_BY_NUMBER_QUERY = gql`
  query GetInvoiceByNumber($storeid: Int!, $invoicenumber: Float!) {
    getInvoiceByNumber(storeid: $storeid, invoicenumber: $invoicenumber) {
      invoiceid
      memonumber
      customerid
      warehouseid
      termsid
      invshippingmethod
      discountpercent
      salestaxrate
      shipping
      amountreceived
      balancedue
      remarks
      invbilltocompanyname
      invbilltoadd1
      invbilltocity
      invbilltostate
      invbilltozip
      invbilltophone
      invshiptocompanyname
      invshiptoadd1
      invshiptocity
      invshiptostate
      invshiptozip
      invshiptophone
      invoicereference
      createdfrommemo
      frommemonumber
      items {
        invoiceitemid
        itemid
        itemcode
        itemdescription
        itemtaxable
        itemunit
        itempcs
        memopcinvoice
        memopcsreturn
        memopcsremain
        itemquantity
        memoqtyinvoice
        memoqtyreturn
        memoqtyremain
        unitprice
        discountpercent
        discountsource
        discountpromotionid
      }
      salesreps {
        userid
        username
        split_percent
      }
    }
  }
`;

export const GET_MEMO_DETAIL_QUERY = gql`
  query GetMemoDetail($storeid: Int!, $memonumber: Float!) {
    getMemoDetail(storeid: $storeid, memonumber: $memonumber) {
      memonumber
      customerid
      warehouseid
      termsid
      invshippingmethod
      discountpercent
      salestaxrate
      shipping
      amountreceived
      balancedue
      remarks
      invbilltocompanyname
      invbilltoadd1
      invbilltocity
      invbilltostate
      invbilltozip
      invbilltophone
      invshiptocompanyname
      invshiptoadd1
      invshiptocity
      invshiptostate
      invshiptozip
      invshiptophone
      items {
        invoiceitemid
        itemid
        itemcode
        itemdescription
        itemtaxable
        itemunit
        itempcs
        memopcinvoice
        memopcsreturn
        memopcsremain
        itemquantity
        memoqtyinvoice
        memoqtyreturn
        memoqtyremain
        unitprice
        discountpercent
        discountsource
        discountpromotionid
      }
    }
  }
`;

export const GET_SALES_ORDER_STATUS_LIST_QUERY = gql`
  query GetSalesOrderStatusList($storeid: Int!) {
    getSalesOrderStatusList(storeid: $storeid) {
      orderstatusid
      statusname
    }
  }
`;

export const GET_SALES_ORDER_LIST_QUERY = gql`
  query GetSalesOrderList(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getSalesOrderList(
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
        customerid
        custcompanyname
        salesorderno
        orderdate
        numberofitems
        netamount
        termsname
        invshippingmethod
        shippingname
        warehousename
        statusname
        createdbyid
        createdbyname
        registerno
        orderprocesseddate
        orderprocessedbyid
        orderprocessedbyname
        warehouseid
        outletid
        invoicepcs
        invoiceqty
        bordpcs
        bordqty
      }
    }
  }
`;


export const GET_INVOICE_DAILY_SUMMARY_QUERY = gql`
  query GetInvoiceDailySummary($outletid: Int!, $startdate: String, $enddate: String) {
    getInvoiceDailySummary(outletid: $outletid, startdate: $startdate, enddate: $enddate) {
      total_today paid_today pending_today voided_today revenue_today avg_today
    }
  }
`;

export const GET_MEMO_DAILY_SUMMARY_QUERY = gql`
  query GetMemoDailySummary($outletid: Int!, $startdate: String, $enddate: String) {
    getMemoDailySummary(outletid: $outletid, startdate: $startdate, enddate: $enddate) {
      total_today paid_today pending_today voided_today revenue_today avg_today
    }
  }
`;

export const GET_SO_DAILY_SUMMARY_QUERY = gql`
  query GetSODailySummary($outletid: Int!, $startdate: String, $enddate: String) {
    getSODailySummary(outletid: $outletid, startdate: $startdate, enddate: $enddate) {
      total_today paid_today pending_today voided_today revenue_today avg_today
    }
  }
`;

export const GET_TODAY_INVOICE_STATS_QUERY = gql`
  query GetTodayInvoiceStats($outletid: Int!) {
    getTodayInvoiceStats(outletid: $outletid) {
      revenue_today total_today paid_today pending_today outstanding_today active_cashiers
    }
  }
`;

export const GET_DAY_END_REPORT_QUERY = gql`
  query GetDayEndReport($storeid: Int!, $outletid: Int!, $date: String!) {
    getDayEndReport(storeid: $storeid, outletid: $outletid, date: $date) {
      date
      summary {
        totalSales totalOutstanding invoiceCount paidCount
      }
      paymentBreakdown {
        paymode paymentCount totalReceived
      }
      cashierBreakdown {
        employeeid employeename invoiceCount totalSales outstanding
      }
      invoices {
        invoicenumber companyname saledate salemodename netamount balancedue statusname
      }
    }
  }
`;

export const GET_CASH_DRAWER_SESSION_QUERY = gql`
  query GetCashDrawerSession($storeid: Int!, $outletid: Int!, $date: String) {
    getCashDrawerSession(storeid: $storeid, outletid: $outletid, date: $date) {
      id outletid date openedby openingfloat expectedclosing actualclosing variance status notes openedat closedat
    }
  }
`;

export const GET_SALES_MATRIX_QUERY = gql`
  query GetSalesMatrix(
    $storeid: Int!
    $outletids: [Int!]!
    $startdate: String!
    $enddate: String!
    $granularity: String!
  ) {
    getSalesMatrix(
      storeid: $storeid
      outletids: $outletids
      startdate: $startdate
      enddate: $enddate
      granularity: $granularity
    ) {
      columns {
        outletid
        outletname
      }
      data {
        period_key
        period_label
        outlets {
          outletid
          totalsales
          salecount
          avgsale
          amountreceived
          balancedue
        }
      }
      totals {
        outletid
        outletname
        totalsales
        salecount
        avgsale
        amountreceived
        balancedue
      }
    }
  }
`;
