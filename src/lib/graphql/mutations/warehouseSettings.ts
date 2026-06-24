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

export const CREATE_WAREHOUSE_MUTATION = gql`
  mutation CreateWarehouse($storeid: Int!, $input: CreateWarehouseInput!) {
    createWarehouse(storeid: $storeid, input: $input) {
      success
      message
      error
    }
  }
`;

export const UPDATE_WAREHOUSE_MUTATION = gql`
  mutation UpdateWarehouse($storeid: Int!, $input: UpdateWarehouseInput!) {
    updateWarehouse(storeid: $storeid, input: $input) {
      success
      message
      error
    }
  }
`;

export const DELETE_WAREHOUSE_MUTATION = gql`
  mutation DeleteWarehouse($storeid: Int!, $warehouseid: Int!) {
    deleteWarehouse(storeid: $storeid, warehouseid: $warehouseid) {
      success
      message
      error
    }
  }
`;
