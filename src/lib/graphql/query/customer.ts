import { gql } from "@apollo/client";

export const GET_INVOICE_AGING_REPORT_QUERY = gql`
  query GetInvoiceAgingReport(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getInvoiceAgingReport(
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
        customername
        companyname
        total_sale
        due_0_30
        due_31_60
        due_61_90
        due_91_120
        due_120_plus
        total_due
        warehouseid
        outletid
      }
    }
  }
`;

export const GET_CUSTOMER_CHEQUE_LIST_QUERY = gql`
  query GetCustomerChequeList(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getCustomerChequeList(
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
        checkpostingdate
        checkno
        checkamount
        checkstatus
        checkentrydate
        checkenteredbyid
        customercheckdetailid
        chkinvoiceno
        chkremarks
        chkbankid
        warehousename
        warehouseid
        outletid
        chkhold
        chknsf
        chkvoid
        lastmodifieddate
        lastmodifiedbyid
      }
    }
  }
`;

export const GET_CUSTOMER_LEDGER_REPORT_QUERY = gql`
  query GetCustomerLedgerReport(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getCustomerLedgerReport(
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
        ledgercustid
        ledgerdate
        ledgerid
        ledgercode
        ledgerdescription
        ledamountdebit
        ledamountcredit
        running_balance
        ledgerreference
        ledgerbankid
        warehouseid
        warehousename
        outletid
      }
    }
  }
`;

export const GET_CUSTOMER_BALANCE_REPORT_QUERY = gql`
  query GetCustomerBalanceReport(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getCustomerBalanceReport(
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
        customername
        companyname
        number_of_sale
        last_sale_date
        total_sale
        amount_received
        total_due
        warehouseid
        outletid
      }
    }
  }
`;

export const GET_CUSTOMER_PAYMENT_LIST_QUERY = gql`
  query GetCustomerPaymentList(
    $outletid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getCustomerPaymentList(
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
        transactionno
        paymentdate
        invoiceno
        paymode
        checkcardno
        amountpaid
        paymentstatus
        appliedbyid
        warehousename
        warehouseid
        outletid
        bankid
        paymentreference
        dateofentry
        voidpayment
        customerpaymentid
        lastmodifieddate
      }
    }
  }
`;

export const GET_CUSTOMER_LIST_QUERY = gql`
  query GetCustomerList(
    $storeid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getCustomerList(
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
        customerid
        custcompanyname
        fullname
        custcity
        phone
        lastsaledate
        lastpaymentdate
        days_since_last_sale
        numberofsales
        balancedue
        totalsale
        opencredit
        mobile
        custregistrationdate
        custemailadd
        warehousename
        warehouseid
        outletid
      }
    }
  }
`;

export const GET_CUSTOMER_QUERY = gql`
  query GetCustomer($storeid: Int!, $customerid: Int!) {
    getCustomer(storeid: $storeid, customerid: $customerid) {
      customerid
      custcompanyname
      custadd1
      custcity
      custstate
      custzip
      custcountry
      custphone1
      custcell
      custemailadd
      custfname
      custlname
      custphone2
      warehouseid
      custdiscount
      custcreditlimit
      termsid
      custshippingmethod
      custbillto
      custshipto
      custtaxid
      custsalestax
      status
      custremarks
      custalertremarks
      custphotopath
    }
  }
`;
