import { gql } from "@apollo/client";

export const ADD_METAL_TYPE_MUTATION = gql`
  mutation AddMetalType($input: AddMetalTypeInput!) {
    addMetalType(input: $input) {
      success
      message
      error
      data
    }
  }
`;

export const EDIT_METAL_TYPE_MUTATION = gql`
  mutation EditMetalType($input: EditMetalTypeInput!) {
    editMetalType(input: $input) {
      success
      message
      error
      data
    }
  }
`;


export const DELETE_METAL_TYPE_MUTATION = gql`
  mutation DeleteMetalType($metaltypeid: Int!, $storeid: Int!) {
    deleteMetalType(metaltypeid: $metaltypeid, storeid: $storeid) {
      success
      message
      error
      data
    }
  }
`;
