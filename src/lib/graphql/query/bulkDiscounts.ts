import { gql } from "@apollo/client";

export const GET_PRODUCT_BULK_DISCOUNTS_QUERY = gql`
  query GetProductBulkDiscounts($storeid: Int!, $itemid: String!) {
    getProductBulkDiscounts(storeid: $storeid, itemid: $itemid) {
      bulkdiscountid
      itemid
      minquantity
      maxquantity
      discountamount
      discounttype
      warehouseid
    }
  }
`;
