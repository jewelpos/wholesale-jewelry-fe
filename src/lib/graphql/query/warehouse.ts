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

const WAREHOUSE_SETTINGS_FIELDS = `
  warehouseid
  warehousename
  saletagkey
  tagpricekey
  pricecodeone
  pricecodetwo
  pricecodethree
  pricecodefour
  pricecodefive
  pricecodesix
  pricecodeseven
  pricecodeeight
  pricecodenine
  pricecodezero
  allowpcsentry
  allowcarriage
  storepolicy
  defaultsalestaxrate
`;

export const GET_ALL_WAREHOUSE_SETTINGS_QUERY = gql`
  query GetAllWarehouseSettings($storeid: Int!) {
    getAllWarehouseSettings(storeid: $storeid) {
      ${WAREHOUSE_SETTINGS_FIELDS}
    }
  }
`;

export const GET_WAREHOUSE_SETTINGS_QUERY = gql`
  query GetWarehouseSettings($storeid: Int!, $warehouseid: Int!) {
    getWarehouseSettings(storeid: $storeid, warehouseid: $warehouseid) {
      ${WAREHOUSE_SETTINGS_FIELDS}
    }
  }
`;

export const GET_WAREHOUSES_FOR_CRUD_QUERY = gql`
  query GetWarehousesForCRUD($storeid: Int!) {
    getWarehousesForCRUD(storeid: $storeid) {
      warehouseid
      outletid
      warehousename
      warehouseaddress
      warehousephone
      issystem
      isdeletedat
    }
  }
`;
