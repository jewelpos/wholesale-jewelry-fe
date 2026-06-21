import { gql } from "@apollo/client";

export const SAVE_INVOICE_HOLD_MUTATION = gql`
  mutation SaveInvoiceHold($input: SaveInvoiceHoldInput!) {
    saveInvoiceHold(input: $input) {
      holdid
      holdname
      customerid
      doctype
      createdat
      updatedat
    }
  }
`;

export const DELETE_INVOICE_HOLD_MUTATION = gql`
  mutation DeleteInvoiceHold($holdid: Int!, $storeid: Int!) {
    deleteInvoiceHold(holdid: $holdid, storeid: $storeid) {
      success
      message
    }
  }
`;
