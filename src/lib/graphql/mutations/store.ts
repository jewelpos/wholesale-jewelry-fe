import { gql } from "@apollo/client";

export const CREATE_STORE_MUTATION = gql`
  mutation CreateStore($input: CreateStoreInput!) {
    createStore(createStoreInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const CREATE_SINGLE_STORE_MUTATION = gql`
  mutation CreateSingleStore($storename: String!, $categoryid: Int!) {
    createSingleStore(storename: $storename, categoryid: $categoryid) {
      success
      message
      error
      data
    }
  }
`;
