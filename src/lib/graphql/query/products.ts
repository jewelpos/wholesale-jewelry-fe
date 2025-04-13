import { gql } from "@apollo/client";

export const GET_ITEM_CATEGORY_LIST_QUERY = gql`
  query GetItemCategoryList(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getItemCategoryList(
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
        categoryid
        categoryname
        categorydescription
        categorycode
        categorycodenextid
        warehousename
        warehouseid
        outletid
        createdby
        createddate
        lastmodifieddate
      }
    }
  }
`;

export const GET_ITEM_SUB_CATEGORY_LIST_QUERY = gql`
  query GetItemSubCategoryList(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getItemSubCategoryList(
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
        subcategoryid
        subcategoryname
        subcategorydescription
        categoryid
        warehousename
        createdby
        warehouseid
        outletid
        createddate
        lastmodifieddate
      }
    }
  }
`;

export const GET_PRODUCT_LIST_QUERY = gql`
  query GetProductList(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getProductList(
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
        itemcode
        itemdescription
        itembarcodeid
        itemsellprice
        categoryname
        subcategoryname
        companyname
        itemquantityinhand
        overall_qty
        lastsaledate
        itemlocation
        itemstatus
        itemimagepath
        warehousename
        itemwarehouseid
        outletid
      }
    }
  }
`;
