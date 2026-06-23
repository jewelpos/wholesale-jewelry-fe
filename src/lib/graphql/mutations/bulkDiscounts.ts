import { gql } from "@apollo/client";

export const SAVE_PRODUCT_BULK_DISCOUNTS_MUTATION = gql`
  mutation SaveProductBulkDiscounts($storeid: Int!, $itemid: String!, $tiers: [BulkDiscountTierInput!]!) {
    saveProductBulkDiscounts(storeid: $storeid, itemid: $itemid, tiers: $tiers) {
      success
      message
      error
    }
  }
`;
