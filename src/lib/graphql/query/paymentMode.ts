import { gql } from "@apollo/client";

export const GET_PAYMENT_MODE_LIST_QUERY = gql`
  query GetPaymentExpenseModes($storeid: Int!, $includeAll: Boolean) {
    getPaymentExpenseModes(storeid: $storeid, includeAll: $includeAll) {
      paymentmodeid
      paymode
      paymodedescription
      warehouseid
      createddate
      displayorder
      status
    }
  }
`;
