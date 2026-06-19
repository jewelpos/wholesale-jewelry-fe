import { gql } from "@apollo/client";

export const GET_PHYSICAL_COUNT_BATCH_LIST_QUERY = gql`
  query GetPhysicalCountBatchList(
    $storeid: Int!
    $outletid: Int
    $warehouseid: Int
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getPhysicalCountBatchList(
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
        batchid
        batchnumber
        warehouseid
        warehousename
        outletid
        scope
        countstatus
        countdate
        posteddate
        totalitems
        counteditems
        totalvariance
        blindcount
        remarks
        createdby
        createddate
        lastmodifieddate
      }
    }
  }
`;

export const GET_PHYSICAL_COUNT_BATCH_QUERY = gql`
  query GetPhysicalCountBatch($storeid: Int!, $batchid: Int!) {
    getPhysicalCountBatch(storeid: $storeid, batchid: $batchid) {
      batchid
      batchnumber
      warehouseid
      warehousename
      outletid
      scope
      categoryid
      categoryname
      subcategoryid
      subcategoryname
      locationfilter
      countstatus
      countdate
      posteddate
      totalitems
      counteditems
      totalvariance
      blindcount
      remarks
      createdby
      createdbyid
      createddate
      lastmodifieddate
      postedby
      postedbyid
    }
  }
`;

export const GET_PHYSICAL_COUNT_BATCH_ITEMS_QUERY = gql`
  query GetPhysicalCountBatchItems($storeid: Int!, $batchid: Int!) {
    getPhysicalCountBatchItems(storeid: $storeid, batchid: $batchid) {
      countitemid
      batchid
      itemid
      itemcode
      itemdescription
      categoryid
      categoryname
      subcategoryid
      subcategoryname
      itemlocation
      itemtype
      bookqty
      bookcost
      countedqty
      recountqty
      finalqty
      variance
      variancecost
      isrecountneeded
      isskipped
      counteddate
      countedbyid
      remarks
      lastmodifieddate
      currentliveqty
    }
  }
`;
