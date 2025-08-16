import { gql } from "@apollo/client";

export const ADD_PRODUCT_MUTATION = gql`
  mutation AddProduct($input: ProductInput!) {
    addProduct(input: $input) {
      success
      message
      itemid
    }
  }
`;

export const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($input: ProductInput!) {
    updateProduct(input: $input) {
      success
      message
      itemid
    }
  }
`;

export const DELETE_PRODUCT_MUTATION = gql`
  mutation DeleteProduct($itemid: Int!, $storeid: Int!) {
    deleteProduct(itemid: $itemid, storeid: $storeid) {
      success
      message
      error
      data
    }
  }
`;
