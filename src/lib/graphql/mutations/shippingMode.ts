import { gql } from "@apollo/client";

export const ADD_SHIPPING_MODE_MUTATION = gql`
  mutation AddShippingMode($input: AddShippingModeInput!) {
    addShippingMode(input: $input) {
      success
      message
      error
    }
  }
`;

export const EDIT_SHIPPING_MODE_MUTATION = gql`
  mutation EditShippingMode($input: EditShippingModeInput!) {
    editShippingMode(input: $input) {
      success
      message
      error
    }
  }
`;

export const DELETE_SHIPPING_MODE_MUTATION = gql`
  mutation DeleteShippingMode($shippingid: Int!, $storeid: Int!) {
    deleteShippingMode(shippingid: $shippingid, storeid: $storeid) {
      success
      message
      error
    }
  }
`;
