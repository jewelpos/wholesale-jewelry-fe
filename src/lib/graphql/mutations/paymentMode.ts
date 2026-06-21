import { gql } from "@apollo/client";

export const ADD_PAYMENT_MODE_MUTATION = gql`
  mutation AddPaymentMode($input: AddPaymentModeInput!) {
    addPaymentMode(input: $input) {
      success
      message
      error
    }
  }
`;

export const EDIT_PAYMENT_MODE_MUTATION = gql`
  mutation EditPaymentMode($input: EditPaymentModeInput!) {
    editPaymentMode(input: $input) {
      success
      message
      error
    }
  }
`;

export const DELETE_PAYMENT_MODE_MUTATION = gql`
  mutation DeletePaymentMode($paymentmodeid: Int!, $storeid: Int!) {
    deletePaymentMode(paymentmodeid: $paymentmodeid, storeid: $storeid) {
      success
      message
      error
    }
  }
`;
