import { gql } from "@apollo/client";

export const CREATE_OUTLET_USER_MUTATION = gql`
  mutation CreateOutletUser($input: CreateOutletUserInput!) {
    createOutletUser(createOutletUserInput: $input) {
      success
      message
      error
      data
    }
  }
`;
