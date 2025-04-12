import { gql } from "@apollo/client";

export const GET_SHIPPING_MODES_QUERY = gql`
  query GetShippingModes($storeid: Int!) {
    getShippingModes(storeid: $storeid) {
      shippingid
      shippingname
      shippingdescription
    }
  }
`;
