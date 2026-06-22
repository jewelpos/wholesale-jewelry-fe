import { gql } from "@apollo/client";

export const GET_PAYMENT_MODE_LIST_QUERY = gql`
  query GetPaymentExpenseModes($storeid: Int!) {
    getPaymentExpenseModes(storeid: $storeid) {
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
