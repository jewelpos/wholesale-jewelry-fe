import { gql } from "@apollo/client";

export const GET_OUTLETS_QUERY = gql`
  query GetOutlets($storeid: [Int]!, $includeAll: Boolean) {
    getOutlets(storeid: $storeid, includeAll: $includeAll) {
      outletid
      storeid
      outletname
      address
      city
      state
      zipcode
      country
      storephone
      storeemail
      storewebsite
      contactperson
      storelogo
      createddate
      isenabled
      setupinventory
      setupoutlet
      setupproduct
      setupreceipt
      setupsalestax
      setupusers
    }
  }
`;
