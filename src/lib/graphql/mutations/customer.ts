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

export const ADD_NEW_CHECK_ON_HAND_MUTATION = gql`
  mutation CreateNewCheckOnHand($input: [CreateNewCheckOnHandInput!]!, $storeid: Int!) {
    createNewCheckOnHand(createNewCheckOnHandInput: $input, storeid: $storeid) {
      success
      message
      error
      data
    }
  }
`;

export const CHANGE_ON_HAND_CHECK_STATUS_MUTATION = gql`
  mutation ChangeOnHandCheckStatus($storeid: Int!, $customercheckdetailid: Int!, $status: String!) {
    changeOnHandCheckStatus(storeid: $storeid, customercheckdetailid: $customercheckdetailid, status: $status) {
      success
      message
      error
      data
    }
  }
`;
