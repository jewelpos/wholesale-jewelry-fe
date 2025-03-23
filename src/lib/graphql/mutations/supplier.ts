import { gql } from "@apollo/client";

export const ADD_SUPPLIER_MUTATION = gql`
  mutation CreateSupplier($input: CreateSupplierInput!) {
    createSupplier(createSupplierInput: $input) {
      success
      message
      error
      data
    }
  }
`;
