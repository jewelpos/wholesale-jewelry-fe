import { gql } from "@apollo/client";

export const GET_ROLES_QUERY = gql`
  query {
    getRoles {
      id
      name
      description
    }
  }
`;
