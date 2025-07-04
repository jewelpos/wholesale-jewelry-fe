import { gql } from "@apollo/client";

export const GET_SUPPLIER_PURCHASE_ORDER_LIST_QUERY = gql`
  query GetSupplierPurchaseOrderList(
    $storeid: Int!
    $supplierid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getSupplierPurchaseOrderList(
      storeid: $storeid
      supplierid: $supplierid
      page: $page
      perpage: $perpage
      filters: $filters
      sortModel: $sortModel
      rowGroupCols: $rowGroupCols
      groupKeys: $groupKeys
    ) {
      total
      data {
        ponumber
        suppliername
        podate
        pototal
        status
        terms
        shippingmethod
        warehouse
        createdby
        lastmodifieddate
        podiscount
        posubtotal
        podiscountamt
        pofreight
        podutypaid
        posalestax
        poconfirmedto
        porequestdate
        poshiptocompanyname
        pomode
        rmano
        supplierid
        pocreatebyid
        postatus
        warehouseid
        termsid
      }
    }
  }
`;

export const GET_SUPPLIER_PURCHASE_ORDER_ITEMS_LIST_QUERY = gql`
  query GetSupplierPurchaseOrderItemsList(
    $storeid: Int!
    $ponumber: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getSupplierPurchaseOrderItemsList(
      storeid: $storeid
      ponumber: $ponumber
      page: $page
      perpage: $perpage
      filters: $filters
      sortModel: $sortModel
      rowGroupCols: $rowGroupCols
      groupKeys: $groupKeys
    ) {
      total
      data {
        poitemid
        ponumber
        itemcode
        itemdescription
        qtyordered
        itemqtyreceived
        itemqtybackorder
        orderunitcost
        orddiscount
        ordextendedprice
        lastmodifieddate
        status
        suppliername
        warehouse
        pobackorderadjusteddate
        adjustedby
      }
    }
  }
`;
