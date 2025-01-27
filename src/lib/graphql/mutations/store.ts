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
