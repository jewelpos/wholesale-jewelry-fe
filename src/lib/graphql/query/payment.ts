import { gql } from "@apollo/client";

export const GET_PAYMENT_TERMS_QUERY = gql`
  query GetPaymentTerms($storeid: Int!) {
    getPaymentTerms(storeid: $storeid) {
      termsid
      termsname
      termsdescription
      termsinterval
      termsduedays
      warehouiseid
      createdate
    }
  }
`;

export const GET_BANK_LIST_QUERY = gql`
  query GetBanksList($storeid: Int!) {
    getBanksList(storeid: $storeid) {
      bankid
      bankname
      created_at
    }
  }
`;
