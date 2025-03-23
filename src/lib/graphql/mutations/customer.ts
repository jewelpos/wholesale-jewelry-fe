import { gql } from "@apollo/client";

export const ADD_CUSTOMER_MUTATION = gql`
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(createCustomerInput: $input) {
      success
      message
      error
      data
    }
  }
`;
