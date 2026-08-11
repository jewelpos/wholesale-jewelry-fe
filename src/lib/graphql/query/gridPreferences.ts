import { gql } from "@apollo/client";

export const GET_GRID_COLUMN_STATE_QUERY = gql`
  query GetGridColumnState($storeid: Int!, $gridkey: String!) {
    getGridColumnState(storeid: $storeid, gridkey: $gridkey)
  }
`;
