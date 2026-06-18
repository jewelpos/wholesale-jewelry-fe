import { gql } from "@apollo/client";

export const CREATE_OUTLET_MUTATION = gql`
  mutation CreateOutlet($input: CreateOutletInput!) {
    createOutlet(createOutletInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const UPDATE_OUTLET_MUTATION = gql`
  mutation UpdateOutlet($input: UpdateOutletInput!) {
    updateOutlet(updateOutletInput: $input) {
      success
      message
      error
      data
    }
  }
`;
