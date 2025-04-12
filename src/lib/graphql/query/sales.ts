import { gql } from "@apollo/client";

export const GET_SALES_INVOICE_LIST_QUERY = gql`
  query GetInvoiceList(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
  ) {
    getInvoiceList(
      outletid: $outletid
      page: $page
      perpage: $perpage
      filters: $filters
      sortModel: $sortModel
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

export const GET_SALES_ORDER_LIST_QUERY = gql`
  query GetSalesOrderList(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
  ) {
    getSalesOrderList(
      outletid: $outletid
      page: $page
      perpage: $perpage
      filters: $filters
      sortModel: $sortModel
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
