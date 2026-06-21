import { gql } from "@apollo/client";

export const SET_MANUAL_METAL_RATES_MUTATION = gql`
  mutation SetManualMetalRates($input: SetMetalRatesInput!) {
    setManualMetalRates(input: $input) {
      success
      message
      error
    }
  }
`;

export const FETCH_METAL_RATES_FROM_KITCO_MUTATION = gql`
  mutation FetchMetalRatesFromKitco($storeid: Int!) {
    fetchMetalRatesFromKitco(storeid: $storeid) {
      success
      message
      error
    }
  }
`;
