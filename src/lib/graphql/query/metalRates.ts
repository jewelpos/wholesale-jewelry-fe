import { gql } from "@apollo/client";

export const GET_CURRENT_METAL_RATES_QUERY = gql`
  query GetCurrentMetalRates($storeid: Int!) {
    getCurrentMetalRates(storeid: $storeid) {
      rateid
      ratedate
      goldspot_oz
      goldspot_gram
      gold10kt_gram
      gold14kt_gram
      gold18kt_gram
      gold22kt_gram
      silver_gram
      platinum_gram
      rhodium_gram
      source
      createdat
    }
  }
`;

export const GET_METAL_RATE_HISTORY_QUERY = gql`
  query GetMetalRateHistory($storeid: Int!, $days: Int) {
    getMetalRateHistory(storeid: $storeid, days: $days) {
      rateid
      ratedate
      goldspot_oz
      gold10kt_gram
      gold14kt_gram
      gold18kt_gram
      gold22kt_gram
      silver_gram
      platinum_gram
      rhodium_gram
      source
      createdat
    }
  }
`;
