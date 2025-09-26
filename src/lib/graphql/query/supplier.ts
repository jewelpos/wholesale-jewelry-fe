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
        phone1
        cellphone
        contactname
        numberofpurchase
        totalpurchase
        balancedue
        opencredit
        totalsalevalue
        lastpurchasedate
        lastpaymentdate
        days_since_last_purchase   
        postchkamount
        accountno
        termsname
        phone2
        city
        emailaddress
        shippimgmethod
        discountrate
        supplierstatus
        remarks
        lastmodifieddate
        modifiedby
        warehousename
        warehouseid
        outletid
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

export const GET_SUPPLIER_INVOICE_LIST_QUERY =  gql`
  query GetSupplierInvoiceList(
    $storeid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getSupplierInvoiceList(
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
        supplierinvoiceid
        companyname
        veninvoiceno
        veninvoicedate
        veninvoicetotal
        veninvamtpaid
        veninvamtbalance
        terms
        refponumber
        invpostingdate
        veninvremarks
        warehousename
        enteredby
        modifiedby
        lastmodifieddate
        warehouseid
        outletid
      }
    }
  }
`;

export const GET_FULL_SUPPLIER_INVOICE_LIST_QUERY = gql`
  query GetFullSupplierInvoiceList($storeid: Int!, $supplierid: Int!) {
    getFullSupplierInvoiceList(storeid: $storeid, supplierid: $supplierid) {
      supplierinvoiceid
      supplierid
      veninvoiceno
      veninvoicedate
      veninvoicetotal
      veninvamtpaid
      veninvamtbalance
      refponumber
      invpostingdate
      veninvremarks
      warehouseid
      veninvbankid
      enteredbyid
      termsid
      venpostchkamount
      venpostchkamountdue
      vencrediapplied
      lastmodifiedbyid
      lastmodifieddate
      warehousename
      suppliername
      termsname
      enteredbyname
    }
  }
`;

export const GET_SUPPLIERS_BY_STORE_ID_QUERY = gql`
  query GetSuppliersByStoreId($storeid: Int!) {
    getSuppliersByStoreId(storeid: $storeid) {
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
`;

export const GET_SUPPLIER_PAYMENTS_QUERY = gql`
  query GetAPPaymentsList(
    $storeid: Int!
    $supplierid: Int
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getAPPaymentsList(
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
        paymentid
        companyname
        postingdate
        reference
        paymode
        checkcardno
        chk_description
        amountpaid
        checkstatus
        appliedby
        supplierid
        bankname
        warehousename
        warehouseid
        voided
        username
        lastmodifieddate
      }
    }
  }
`;

export const GET_SUPPLIER_APPLIED_AMOUNT_LIST_QUERY = gql`
  query GetSupplierAppliedAmountList(
    $storeid: Int!
    $supplierpaymentid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getSupplierAppliedAmountList(
      storeid: $storeid
      supplierpaymentid: $supplierpaymentid
      page: $page
      perpage: $perpage
      filters: $filters
      sortModel: $sortModel
      rowGroupCols: $rowGroupCols
      groupKeys: $groupKeys
    ) {
      total
      data {
        appliedamountid
        supplierpaymentid
        paymode
        appliedamount
        invoicenumber
        applieddate
        checkcardno
        appliedby
        voided
        creditinvoice
        warehousename
        chk_description
        companyname
        lastmodifieddate
        supplierid
        warehouseid
      }
    }
  }
`;

export const GET_SUPPLIER_INVOICE_QUERY = gql`
query GetSingleSupplierInvoice($storeid: Int!, $supplierinvoiceid: Int!) {
  getSingleSupplierInvoice(storeid: $storeid, supplierinvoiceid: $supplierinvoiceid) {
    supplierinvoiceid
    supplierid
    veninvoiceno
    veninvoicedate
    veninvoicetotal
    veninvamtpaid
    veninvamtbalance
    refponumber
    invpostingdate
    veninvremarks
    warehouseid
    veninvbankid
    enteredbyid
    termsid
    venpostchkamount
    venpostchkamountdue
    vencrediapplied
    lastmodifiedbyid
    lastmodifieddate
    warehousename
    suppliername
    termsname
    enteredbyname
  }
}
`;

export const GET_SUPPLIER_BALANCE_DUE_QUERY = gql`
query GetSupplierBalanceDue($storeid: Int!, $outletid: Int!, $supplierid: Int!) {
  getSupplierBalanceDue(storeid: $storeid, outletid: $outletid, supplierid: $supplierid) {
    supplierinvoiceid
    supplierid
    veninvoiceno
    veninvoicedate
    veninvoicetotal
    veninvamtpaid
    veninvamtbalance
    warehouseid
  }
}
`;

export const GET_NON_VOIDED_SUPPLIER_PAYMENT_TRANSACTION_LIST_QUERY = gql`
  query GetNonVoidedSupplierPaymentTransactionList($storeid: Int!, $supplierid: Int!) {
    getNonVoidedSupplierPaymentTransactionList(storeid: $storeid, supplierid: $supplierid) {
      paymentid
      companyname
      postingdate
      reference
      paymode
      checkcardno
      chk_description
      amountpaid
      supplierid
      bankname
      warehousename
      warehouseid
      voided
      username
      lastmodifieddate
    }
  }
`;

export const GET_APPLIED_AMOUNT_LIST_BY_SUPPLIER_PAYMENT_ID_QUERY = gql`
  query GetAppliedAmountListBySupplierPaymentId($storeid: Int!, $supplierpaymentid: Int!) {
    getAppliedAmountListBySupplierPaymentId(storeid: $storeid, supplierpaymentid: $supplierpaymentid) {
      appliedamountid
      supplierpaymentid
      paymode
      appliedamount
      invoicenumber
      applieddate
      checkcardno
      appliedby
      voided
      creditinvoice
      warehousename
      chk_description
      companyname
      lastmodifieddate
      supplierid
      warehouseid
    }
  }
`;

export const GET_SUPPLIER_INVOICE_LIST_BY_PAYMENT_ID_QUERY = gql`
  query GetSupplierInvoiceListByPaymentId($storeid: Int!, $supplierid: Int!, $supplierpaymentid: Int!) {
    getSupplierInvoiceListByPaymentId(storeid: $storeid, supplierid: $supplierid, supplierpaymentid: $supplierpaymentid) {
      supplierinvoiceid
      supplierid
      veninvoiceno
      veninvoicedate
      veninvoicetotal
      veninvamtpaid
      veninvamtbalance
      refponumber
      invpostingdate
      veninvremarks
      warehouseid
      veninvbankid
      enteredbyid
      termsid
      venpostchkamount
      venpostchkamountdue
      vencrediapplied
      lastmodifiedbyid
      lastmodifieddate
      warehousename
      suppliername
      termsname
      enteredbyname
    }
  }
`;

export const GET_SUPPLIER_CREDIT_BALANCE_DUE_QUERY = gql`
  query GetSupplierCreditBalanceDue($storeid: Int!, $supplierid: Int!) {
    getSupplierCreditBalanceDue(storeid: $storeid, supplierid: $supplierid) {
      balanceDueSuppliers {
        supplierinvoiceid
        supplierid
        veninvoiceno
        veninvoicedate
        veninvoicetotal
        veninvamtpaid
        veninvamtbalance
        warehouseid
      }
      balanceDueInvoices {
        supplierinvoiceid
        supplierid
        veninvoiceno
        veninvoicedate
        veninvoicetotal
        veninvamtpaid
        veninvamtbalance
        warehouseid
      }
    }
  }
`;

// New query to get supplier credit apply summary (credit invoices and balance due invoices)
export const GET_SUPPLIER_CREDIT_APPLY_SUMMARY_QUERY = gql`
  query GetSupplierCreditApplySummary($storeid: Int!, $outletid: Int!, $supplierid: Int!) {
    getSupplierCreditApplySummary(storeid: $storeid, outletid: $outletid, supplierid: $supplierid) {
      hasCredit
      creditAvailable
      creditInvoices {
        supplierinvoiceid
        supplierid
        veninvoiceno
        veninvoicedate
        veninvoicetotal
        veninvamtpaid
        veninvamtbalance
        warehouseid
        isCreditInvoice
      }
      balanceDueInvoices {
        supplierinvoiceid
        supplierid
        veninvoiceno
        veninvoicedate
        veninvoicetotal
        veninvamtpaid
        veninvamtbalance
        warehouseid
        isCreditInvoice
      }
    }
  }
`;

export const GET_SUPPLIER_BY_OUTLET_ID_QUERY = gql`
  query GetSupplierByOutletId($storeid: Int!, $outletid: Int!) {
    getSupplierByOutletId(storeid: $storeid, outletid: $outletid) {
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
      createdby
      lastmodifiedbyid
      modifiedby
      lastmodifieddate
      lastpurchasedate
      lastpaymentdate
      days_since_last_purchase
      numberofpurchase
      balancedue
      totalpurchase
      opencredit
      totalsalevalue
      postchkamount
    }
  }
`;

export const GET_ON_HAND_CHEQUE_SUMMARY_LIST_QUERY = gql`
  query GetOnHandChequeSummaryList(
    $storeid: Int!
    $page: Int!
    $perpage: Int!
    $filters: [FilterKeyValuePair]
    $sortModel: [SortModelInput]
    $rowGroupCols: [RowGroupColInput]
    $groupKeys: [String]
  ) {
    getOnHandChequeSummaryList(
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
        supplierid
        companyname
        year
        total_amount
        total_checks
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
    }
  }
`;
