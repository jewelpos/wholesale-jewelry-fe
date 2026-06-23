import { gql } from "@apollo/client";

export const UPSERT_WAREHOUSE_SETTINGS_MUTATION = gql`
  mutation UpsertWarehouseSettings($storeid: Int!, $input: UpsertWarehouseSettingsInput!) {
    upsertWarehouseSettings(storeid: $storeid, input: $input) {
      success
      message
      error
    }
  }
`;
