import { gql } from "@apollo/client";

export const GET_SUPPLIER_PURCHASE_ORDER_LIST_QUERY = gql`
  query GetSupplierPurchaseOrderList(
    $storeid: Int!
    $supplierid: Int
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

export const GET_PURCHASE_ORDER_STATUS_LIST_QUERY = gql`
  query GetPurchaseOrderStatusList($storeid: Int!) {
    getPurchaseOrderStatusList(storeid: $storeid) {
      statusid
      statusname
      description
    }
  }
`;

export const GET_SINGLE_PURCHASE_ORDER_QUERY = gql`
  query GetSinglePurchaseOrder($storeid: Int!, $ponumber: Int!) {
    getSinglePurchaseOrder(storeid: $storeid, ponumber: $ponumber) {
      purchaseorder {
        ponumber
        supplierid
        pocreatebyid
        podate
        postatus
        podiscount
        termsid
        poremarks
        poconfirmedto
        posubtotal
        podiscountamt
        pofreight
        pototal
        posalestax
        poshippingmethod
        warehouseid
        podutypaid
        porequestdate
        poordtocompanyname
        poordtoadd1
        poordtoadd2
        poordtocity
        poordtostate
        poordtozip
        poordtocountry
        poordtophone
        poshiptocompanyname
        poshiptoadd1
        poshiptoadd2
        poshiptocity
        poshiptostate
        poshiptozip
        poshiptocountry
        poshiptophone
        pomode
        rmano
        lastmodifieddate
        pototalwithoutdiscount
        posales
      }
      items {
        poitemid
        ponumber
        itemcode
        itemunit
        qtyordered
        orderunitcost
        orddiscount
        ordextendedprice
        orderactualcost
        poposting
        itemqtybackorder
        itemqtyreceived
        pobackorderadjusteddate
        pobackorderadjustby
        lastmodifieddate
        itemid
      }
    }
  }
`;

export const GET_ALL_PURCHASE_ORDER_ITEMS_BY_PO_QUERY = gql`
  query GetAllPurchaseOrderItemsByPo($storeid: Int!, $ponumber: Int!) {
    getSupplierPurchaseOrderItemsList(storeid: $storeid, ponumber: $ponumber, page: 1, perpage: 1000) {
      total
      data {
        poitemid
        itemid
        itemcode
        itemunit
        qtyordered
        orderunitcost
        orddiscount
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
