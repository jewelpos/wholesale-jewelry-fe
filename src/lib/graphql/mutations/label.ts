import { gql } from "@apollo/client";

export const CREATE_INVENTORY_TAG_LABEL_MUTATION = gql`
  mutation CreateInventoryTagLabel($input: CreateInventoryTagLabelInput!) {
    createInventoryTagLabel(input: $input)
  }
`;

export const UPDATE_INVENTORY_TAG_LABEL_MUTATION = gql`
  mutation UpdateInventoryTagLabel($input: UpdateInventoryTagLabelInput!) {
    updateInventoryTagLabel(input: $input) {
      success
      message
      error
    }
  }
`;

export const DELETE_INVENTORY_TAG_LABEL_MUTATION = gql`
  mutation DeleteInventoryTagLabel($storeid: Int!, $labelid: Int!) {
    deleteInventoryTagLabel(storeid: $storeid, labelid: $labelid) {
      success
      message
      error
    }
  }
`;
