import { gql } from "@apollo/client";

export const GET_SUPPLIER_LEDGER_LIST_QUERY = gql`
  query GetSupplierLedgerList(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
  ) {
    getSupplierLedgerList(
      outletid: $outletid
      page: $page
      perpage: $perpage
      filters: $filters
      sortModel: $sortModel
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
  ) {
    getSupplierList(
      outletid: $outletid
      page: $page
      perpage: $perpage
      filters: $filters
      sortModel: $sortModel
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
