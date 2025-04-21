import { gql } from "@apollo/client";

export const GET_SUPPLIER_LEDGER_LIST_QUERY = gql`
  query GetSupplierLedgerList(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getSupplierLedgerList(
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
        supplierid
        ledgerdate
        ledgerid
        ledgercode
        ledgerdescription
        ledamountdebit
        ledamountcredit
        running_balance
        ledgerreference
        ledgerbankid
        warehousename
        warehouseid
        outletid
      }
    }
  }
`;

export const GET_SUPPLIER_LIST_QUERY = gql`
  query GetSupplierList(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getSupplierList(
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
        supplierid
        companyname
        contactname
        city
        accountno
        termsname
        phone1
        cellphone
        emailaddress
        webaddress
        shippimgmethod
        discountrate
        warehousename
        address1
        address2
        state
        zipcode
        country
        phone2
        supplierstatus
        remarks
        warehouseid
        outletid
        createdbyid
        createddate
        lastmodifiedbyid
        lastmodifieddate
      }
    }
  }
`;

export const GET_SUPPLIER_QUERY = gql`
  query GetSupplierBySupplierId($storeid: Int!, $supplierid: Int!) {
    getSupplierBySupplierId(storeid: $storeid, supplierid: $supplierid) {
      supplierid
      companyname
      address1
      address2
      city
      state
      zipcode
      country
      contactperson1
      phone1
      phone2
      cellphone
      emailaddress
      webaddress
      shippimgmethod
      termsid
      accountno
      discountrate
      supplierstatus
      remarks
      warehouseid
      supplierfname
      supplierlname
    }
  }
`;
