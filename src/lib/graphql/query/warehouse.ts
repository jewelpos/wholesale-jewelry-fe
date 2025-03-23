import { gql } from "@apollo/client";

export const GET_WAREHOUSES_BY_STORE_ID_QUERY = gql`
  query GetWarehousesByStoreId($storeid: Int!) {
    getWarehousesByStoreId(storeid: $storeid) {
      warehouseid
      outletid
      warehousename
      warehouseaddress
      warehousephone
      issystem
    }
  }
`;
