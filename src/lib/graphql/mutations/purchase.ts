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

export const RETURN_PURCHASE_ORDER_MUTATION = gql`
  mutation ReturnPurchaseOrder($input: ReturnPurchaseOrderInput!) {
    returnPurchaseOrder(returnPurchaseOrderInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const DELETE_PURCHASE_ORDER_MUTATION = gql`
  mutation DeletePurchaseOrder($storeid: Int!, $ponumber: Int!) {
    deletePurchaseOrder(storeid: $storeid, ponumber: $ponumber) {
      success
      message
      error
      data
    }
  }
`;

export const RECEIVE_PURCHASE_ORDER_MUTATION = gql`
  mutation ReceivePurchaseOrder($input: ReceivePurchaseOrderInput!) {
    receivePurchaseOrder(receivePurchaseOrderInput: $input) {
      success
      message
      error
      data
    }
  }
`;
