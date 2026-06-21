import { gql } from "@apollo/client";

export const GET_INVOICE_HOLDS_QUERY = gql`
  query GetInvoiceHolds($storeid: Int!, $outletid: Int!, $doctype: String) {
    getInvoiceHolds(storeid: $storeid, outletid: $outletid, doctype: $doctype) {
      holdid
      storeid
      outletid
      doctype
      holdname
      customerid
      formdata
      createdby
      createdat
      updatedat
    }
  }
`;
