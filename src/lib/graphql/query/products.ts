import { gql } from "@apollo/client";

// Product settings query
export const GET_PRODUCT_SETTINGS_INFO_QUERY = gql`
  query GetProductSettingsInfo($storeid: Int!, $warehouiseid: Int!) {
    getProductSettingsInfo(storeid: $storeid, warehouiseid: $warehouiseid) {
      codechars
      saletagkey
      tagpricekey
    }
  }
`;

export const GET_INVENTORY_TRANSFER_STATUS_LIST_QUERY = gql`
  query GetInventoryTransferStatusList($storeid: Int!) {
    getInventoryTransferStatusList(storeid: $storeid) {
      transferstatusid
      transferstatusname
      description
    }
  }
`;

export const GET_TRANSFER_STATUS_LIST_QUERY = gql`
  query GetTransferStatusList($storeid: Int!) {
    getTransferStatusList(storeid: $storeid) {
      transferstatusid
      statusname
    }
  }
`;

export const GET_INVENTORY_TRANSFER_LIST_BY_STATUS_QUERY = gql`
  query GetInventoryTransferListByStatus($storeid: Int!, $transferstatusid: Int!) {
    getInventoryTransferListByStatus(storeid: $storeid, transferstatusid: $transferstatusid) {
      inventoryitemtransferid
      transfermode
      transfersource
      destination
      transfertype
      totalitemtransfered
      totalquantities
      username
      transferdatetime
      remarks
      warehousename
      warehouseid
      outletid
      fromoutletid
      tooutletid
      fromwarhouse
      towarehouse
      transferstatus
      transferstatusid
    }
  }
`;

export const GET_PRODUCT_AGING_LIST_QUERY = gql`
  query GetProductAgingList(
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
    getProductAgingList(
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
        itemid
        itembarcodeid
        itemcode
        itemdescription
        supplier
        warehousename
        itemquantityinhand
        unit_cost
        total_cost
        last_inbound_date
        age_days
        inbound_aging_bucket
        last_sale_date
        last_sale_days
        sales_aging_bucket
        sale_price
        total_sale_value
        warehouseid
        outletid
      }
    }
  }
`;

// New simplified queries for categories and subcategories
export const GET_ITEM_CATEGORIES_QUERY = gql`
  query GetItemCategories($storeid: Int!) {
    getItemCategories(storeid: $storeid) {
      categoryid
      categoryname
      categorydescription
      categorycode
    }
  }
`;

export const GET_ITEM_SUBCATEGORIES_QUERY = gql`
  query GetItemSubcategories($storeid: Int!, $categoryid: Int) {
    getItemSubcategories(storeid: $storeid, categoryid: $categoryid) {
      subcategoryid
      subcategoryname
      subcategorydescription
      categoryid
    }
  }
`;

export const GET_CATEGORY_BY_ID_QUERY = gql`
  query GetCategoryById($categoryid: Int!, $storeid: Int!) {
    getCategoryById(categoryid: $categoryid, storeid: $storeid) {
      categoryid
      categoryname
      categorydescription
      categorycode
      warehouseid
      storeid
    }
  }
`;

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

export const GET_PRODUCT_BY_ITEMCODE_QUERY = gql`
  query GetProductByItemCode($itemcode: String!, $storeid: Int!) {
    getProductByItemCode(itemcode: $itemcode, storeid: $storeid) {
      itemcode
      itembarcodeid
      itemdescription
      supplierid
      supplieritemcode
      supplierbarcodeid
      modelno
      manufacturer
      itemreorderqtypnt
      itemreorderqty
      itemcategoryid
      subcategoryid
      itemstatus
      itemtaxable
      trackinventory
      itemimagepath
      itemlocation
      itempurchaseprice
      itemtagpricecode
      itemtagprice
      itemdiscount
      itemmetal
      itemremarks
      itemalertwarning
      itemwarningmessage
      detaileditemdescription
      tag1
      tag2
      tag3
      tag4
      tag5
      tag6
      tag7
      tag8
      tag9
      tag10
      dshape
      dlab
      dcerno
      dcarat
      ddiameter
      dcolor
      dclarity
      dflorence
      dpolarity
      ddepth
      dtable
      dgirdle
      dculut
      dpolish
      dsymmetry
      dcrownheight
      dcrownangle
      dpavillionheight
      dpavillionangle
      dmesurement
      dsize
      dquality
      dstockno
      drapprice
      dcost
      dsaleprice
      dpricecode
      itemid
      itemwarehouseid
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
    getProductListNew(
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
        itemid
        itemdescription
        itembarcodeid
        itemsellprice
        categoryname
        subcategoryname
        supplier: companyname
        itemquantityinhand
        overall_qty
        totalsalevalue
        totalcostvalue
        itemlocation
        itemstatus
        itemimagepath
        warehousename
        outletid
        createddate
        lastmodifieddate
        itemwarehouseid
        memoqty
        soquantity
        lastsaledate
        lastpurchasedate
        totalqtypurchased: qtypurchased
        calculatedavgcost: avgpurchasecost
        availableqty
        totalsoldqty
        totalsoldpcs: pcssold
        totalsoldvalue
        totalsoldcost
        totalsoldprofit
        itemaveragecost
        adjdate
        createdby
        modifiedby
        adjustedby
        lasttransferdate
        transferby
      }
    }
  }
`;

export const GET_PRODUCT_ACTIVITY_LIST_QUERY = gql`
  query GetProductActivityList(
    $storeid: Int!
    $warehouseid: Int
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getProductActivityList(
      storeid: $storeid
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
        itemcode
        transaction_type
        transation_date
        reference
        quantity
        warehouse
        warehouseid
      }
    }
  }
`;

export const GET_INVENTORY_ADJUSTMENT_LIST_QUERY = gql`
  query GetInventoryAdjustmentList(
    $storeid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getInventoryAdjustmentList(
      storeid: $storeid
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
        description
        adjusted_date
        qty_adjusted
        cost_adjusted
        new_qty
        new_cost
        updated_by
        warehouse
        adj_id
        itemid
        lastmodifieddate
        warehouseid
        updateremarks
      }
    }
  }
`;

export const GET_INVENTORY_TRANSFER_LIST_QUERY = gql`
  query GetInventoryTransferList(
    $storeid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getInventoryTransferList(
      storeid: $storeid
      page: $page
      perpage: $perpage
      filters: $filters
      sortModel: $sortModel
      rowGroupCols: $rowGroupCols
      groupKeys: $groupKeys
    ) {
      total
      data {
        inventoryitemtransferid
        transfermode
        transfersource
        destination
        transfertype
        totalitemtransfered
        totalquantities
        username
        transferdatetime
        remarks
        warehousename
        warehouseid
        outletid
        fromoutletid
        tooutletid
        fromwarhouse
        towarehouse
        transferstatus
        transferstatusid
      }
    }
  }
`;

export const GET_INVENTORY_TRANSFER_ITEM_QUERY = gql`
  query GetInventoryTransferItemList($storeid: Int!, $inventoryitemtransferid: Int!) {
    getInventoryTransferItemList(
      storeid: $storeid
      inventoryitemtransferid: $inventoryitemtransferid
    ) {
      inventoryitemtransferdetailid
      inventoryitemtransferid
      itemcode
      itemdescription
      transferquantity
      transferdate
      username
      warehousename
      transferbyid
      warehouseid
      lastmodifieddate
      quantityreceived
      receiveddate
      recivedby
      itemreceived
    }
  }
`;

export const GET_INVENTORY_TRANSFER_ITEM_PAGED_QUERY = gql`
  query GetInventoryTransferItem(
    $storeid: Int!
    $inventoryitemtransferid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getInventoryTransferItem(
      storeid: $storeid
      inventoryitemtransferid: $inventoryitemtransferid
      page: $page
      perpage: $perpage
      filters: $filters
      sortModel: $sortModel
      rowGroupCols: $rowGroupCols
      groupKeys: $groupKeys
    ) {
      total
      data {
        inventoryitemtransferdetailid
        inventoryitemtransferid
        itemcode
        itemdescription
        transferquantity
        transferdate
        username
        warehousename
        transferbyid
        warehouseid
        lastmodifieddate
      }
    }
  }
`;
