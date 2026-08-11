import { gql } from "@apollo/client";

export const SAVE_GRID_COLUMN_STATE_MUTATION = gql`
  mutation SaveGridColumnState($storeid: Int!, $gridkey: String!, $columnstate: String!) {
    saveGridColumnState(storeid: $storeid, gridkey: $gridkey, columnstate: $columnstate)
  }
`;
