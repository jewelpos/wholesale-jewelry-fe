import { gql } from "@apollo/client";

export const GET_STORE_CATEGORY_QUERY = gql`
  query GetStoreCategory {
    getStoreCategory {
      name
      id
    }
  }
`;

export const GET_STORES = gql`
  query {
    getStores {
      storeid
      creationdatetime
      isenabled
      storecategoryid
      storename
      institutionid
      hassetupoutlet
      hassetupusers
      hassetupsalestax
      hassetupinventory
      hassetupproduct
      hassetupreceipt
    }
  }
`;

export const GET_STORE = gql`
  query GetStore($storeid: Int!) {
    getStore(storeid: $storeid) {
      storeid
      creationdatetime
      isenabled
      storecategoryid
      storename
      institutionid
      hassetupoutlet
      hassetupusers
      hassetupsalestax
      hassetupinventory
      hassetupproduct
      hassetupreceipt
    }
  }
`;
