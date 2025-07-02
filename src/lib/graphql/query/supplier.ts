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
query GetSupplierBalanceDue($storeid: Int!, $supplierid: Int!) {
  getSupplierBalanceDue(storeid: $storeid, supplierid: $supplierid) {
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
