import { gql } from "@apollo/client";

export const GET_CUSTOMER_DOCUMENTS_QUERY = gql`
  query GetCustomerDocuments($storeid: Int!, $customerid: Int!) {
    getCustomerDocuments(storeid: $storeid, customerid: $customerid) {
      documentid
      customerid
      documentname
      documenttype
      s3url
      s3key
      filesize
      uploadeddate
      uploadedby
    }
  }
`;
