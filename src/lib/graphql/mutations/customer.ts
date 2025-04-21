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

export const DELETE_CUSTOMER_MUTATION = gql`
  mutation DeleteCustomer($customerid: Int!, $storeid: Int!) {
    deleteCustomer(customerid: $customerid, storeid: $storeid) {
      success
      message
      error
      data
    }
  }
`;
