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
        createdbyid
        registerno
        isweborder
        invsalesorder
        voiddate
        lastmodifiedbyid
        lastmodifieddate
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
        salesorderno
        orderdate
        numberofitems
        netamount
        termsname
        invshippingmethod
        warehousename
        statusname
        createdbyid
        registerno
        orderprocesseddate
        orderprocessedbyid
        warehouseid
        outletid
      }
    }
  }
`;
