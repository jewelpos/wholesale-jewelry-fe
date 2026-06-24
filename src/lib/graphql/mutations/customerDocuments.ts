import { gql } from "@apollo/client";

export const DELETE_CUSTOMER_DOCUMENT_MUTATION = gql`
  mutation DeleteCustomerDocument($documentid: Int!, $storeid: Int!) {
    deleteCustomerDocument(documentid: $documentid, storeid: $storeid) {
      success
      message
      error
    }
  }
`;
