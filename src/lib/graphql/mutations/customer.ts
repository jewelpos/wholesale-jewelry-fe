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

export const CREATE_CUSTOMER_PAYMENT_MUTATION = gql`
  mutation CreateCustomerPayment($input: CreateCustomerPaymentInput!) {
    createCustomerPayment(createCustomerPaymentInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const CREATE_CUSTOMER_CREDIT_APPLY_MUTATION = gql`
  mutation CreateCustomerCreditApply($input: CreateCustomerCreditApplyInput!) {
    createCustomerCreditApply(createCustomerCreditApplyInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const ADD_NEW_CHECK_ON_HAND_MUTATION = gql`
  mutation CreateNewCheckOnHand($input: CreateNewCheckOnHandInput!, $storeid: Int!) {
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

export const UPDATE_CHECK_ON_HAND_MUTATION = gql`
  mutation UpdateNewCheckOnHand($input: EditCheckOnHandInput!, $storeid: Int!) {
    updateNewCheckOnHand(editCheckOnHandInput: $input, storeid: $storeid) {
      success
      message
      error
      data
    }
  }
`;

export const DELETE_CHECK_ON_HAND_MUTATION = gql`
  mutation DeleteCheckOnHand($customercheckdetailid: Int!, $storeid: Int!) {
    deleteCheckOnHand(customercheckdetailid: $customercheckdetailid, storeid: $storeid) {
      success
      message
      error
      data
    }
  }
`;

export const VOID_CUSTOMER_PAYMENT_MUTATION = gql`
  mutation VoidCustomerPayment($input: VoidCustomerPaymentInput!) {
    voidCustomerPayment(voidCustomerPaymentInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const SEND_STATEMENT_SMS_MUTATION = gql`
  mutation SendCustomerStatementSMS($input: SendStatementSMSInput!) {
    sendCustomerStatementSMS(input: $input) {
      success
      message
      error
      data
    }
  }
`;
