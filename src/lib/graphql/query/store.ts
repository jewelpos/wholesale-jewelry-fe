import { gql } from "@apollo/client";

export const GET_STORE_CATEGORY_QUERY = gql`
  query GetStoreCategory {
    getStoreCategory {
      name
      id
    }
  }
`;
