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

export const GET_WAREHOUSES_BY_OUTLET_ID_QUERY = gql`
  query GetWarehousesByOutletId($outletid: Int!) {
    getWarehousesByOutletId(outletid: $outletid) {
      warehouseid
      outletid
      warehousename
      warehouseaddress
      warehousephone
      issystem
    }
  }
`;
