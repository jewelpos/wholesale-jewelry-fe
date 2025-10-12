import { gql } from "@apollo/client";

export const CREATE_PURCHASE_ORDER_MUTATION = gql`
  mutation CreatePurchaseOrder($input: CreatePurchaseOrderInput!) {
    createPurchaseOrder(createPurchaseOrderInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const EDIT_PURCHASE_ORDER_MUTATION = gql`
  mutation EditPurchaseOrder($input: EditPurchaseOrderInput!) {
    editPurchaseOrder(editPurchaseOrderInput: $input) {
      success
      message
      error
      data
    }
  }
`;
