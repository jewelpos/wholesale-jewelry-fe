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
