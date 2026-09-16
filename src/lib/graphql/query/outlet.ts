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

// Presence indicator (top bar) — who's currently logged in, grouped by outlet. See
// getActiveUsersByOutlet in store.service.ts for what "active" means here (reuses the
// existing session table, not a new real-time heartbeat).
export const GET_ACTIVE_USERS_BY_OUTLET_QUERY = gql`
  query GetActiveUsersByOutlet($storeid: Int!) {
    getActiveUsersByOutlet(storeid: $storeid) {
      outletid
      outletname
      users {
        userid
        userfullname
        initials
        lastactivity
      }
    }
  }
`;
