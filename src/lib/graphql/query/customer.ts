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
    $storeid: Int!
    $customerid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getCustomerChequeList(
      storeid: $storeid
      customerid: $customerid
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
        checkpostingdate
        checkno
        checkamount
        checkstatus
        checkentrydate
        enteredby
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
        modifiedby
      }
    }
  }
`;

export const GET_CUSTOMER_LEDGER_REPORT_QUERY = gql`
  query GetCustomerLedgerReport(
    $outletid: Int!
    $customerid: Int
    $fromdate: String
    $todate: String
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
    $excludeInternalEntries: Boolean
  ) {
    getCustomerLedgerReport(
      outletid: $outletid
      customerid: $customerid
      fromdate: $fromdate
      todate: $todate
      page: $page
      perpage: $perpage
      filters: $filters
      sortModel: $sortModel
      rowGroupCols: $rowGroupCols
      groupKeys: $groupKeys
      excludeInternalEntries: $excludeInternalEntries
    ) {
      total
      openingBalance
      data {
        ledgercustid
        custcompanyname
        customername
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
        transactionno
        custcompanyname
        paymentdate
        invoiceno
        paymode
        checkcardno
        amountpaid
        paymentstatus
        appliedby
        paymentreference
        customerid
        bankname
        warehousename
        warehouseid
        outletid
        dateofentry
        voidpayment
        customerpaymentid
        lastmodifieddate
      }
    }
  }
`;

export const GET_CUSTOMER_APPLIED_AMOUNT_LIST_QUERY = gql`
  query GetCustomerAppliedAmountList($storeid: Int!, $customerpaymentsid: Float!) {
    getCustomerAppliedAmountList(
      storeid: $storeid
      customerpaymentsid: $customerpaymentsid
    ) {
      customercheckappliedamountid
      customerpaymentsid
      customerid
      custcompanyname
      appliedamount
      invoicenumber
      applieddate
      isvoided
      iscreditinvoice
      warehousename
      warehouseid
      lastmodifieddate
    }
  }
`;

export const GET_CUSTOMER_LIST_SUMMARY_QUERY = gql`
  query GetCustomerListSummary($storeid: Int!) {
    getCustomerListSummary(storeid: $storeid) {
      total_customers
      total_balance_due
      total_sales
      customers_with_balance
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

export const GET_CUSTOMERS_QUERY = gql`
  query GetCustomers($storeid: Int!) {
    getCustomers(storeid: $storeid) {
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
      custalert
    }
  }
`;

export const GET_CUSTOMER_BALANCE_DUE_INVOICES_QUERY = gql`
  query GetCustomerBalanceDueInvoices(
    $storeid: Int!
    $customerid: Int!
    $outletid: Int!
    $warehouseid: Int!
    $isCredit: Boolean!
  ) {
    getCustomerBalanceDueInvoices(
      storeid: $storeid
      customerid: $customerid
      outletid: $outletid
      warehouseid: $warehouseid
      isCredit: $isCredit
    ) {
      invoicenumber
      customerid
      saledate
      totalamount
      amountreceived
      balancedue
      warehouseid
    }
  }
`;

export const GET_CUSTOMER_CREDIT_APPLY_SUMMARY_QUERY = gql`
  query GetCustomerCreditApplySummary(
    $storeid: Int!
    $outletid: Int!
    $customerid: Int!
  ) {
    getCustomerCreditApplySummary(
      storeid: $storeid
      customerid: $customerid
      outletid: $outletid
    ) {
      hasCredit
      creditAvailable
      creditInvoices {
        invoicenumber
        customerid
        saledate
        totalamount
        amountreceived
        balancedue
        warehouseid
        isCreditInvoice
      }
      balanceDueInvoices {
        invoicenumber
        customerid
        saledate
        totalamount
        amountreceived
        balancedue
        warehouseid
        isCreditInvoice
      }
    }
  }
`;



export const GET_CUSTOMER_CHEQUE_SUMMARY_LIST_QUERY = gql`
  query GetCustomerChequeSummaryList(
    $storeid: Int!
    $customerid: Int
    $year: Int
    $warehouseid: Int
  ) {
    getCustomerChequeSummaryList(
    storeid: $storeid
    customerid: $customerid
    year: $year
    warehouseid: $warehouseid
  ) {
    customerid
    custcompanyname
    warehouseid
    outletid
    year
    Jan
    Feb
    Mar
    Apr
    May
    Jun
    Jul
    Aug
    Sep
    Oct
    Nov
    Dec
    yearly_total
  }
}`;

export const GET_CUSTOMER_MONTHLY_SALES_PIVOT_QUERY = gql`
  query GetMonthlyCustomerSalesPivot(
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
    getMonthlyCustomerSalesPivot(
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
        customerid
        custcompanyname
        year
        invoice_count
        total_sales
        total_balance_due
        total_profit
        jan
        feb
        mar
        apr
        may
        jun
        jul
        aug
        sep
        oct
        nov
        dec
        warehousename
        warehouseid
        outletid
      }
      totalsRow {
        invoice_count
        total_sales
        total_balance_due
        total_profit
        jan
        feb
        mar
        apr
        may
        jun
        jul
        aug
        sep
        oct
        nov
        dec
      }
    }
  }
`;
