import { gql } from "@apollo/client";

export const GET_METAL_TYPE_LIST_QUERY = gql`
  query GetMetalTypeList($storeid: Int!) {
    getMetalTypeList(storeid: $storeid) {
      metaltypeid
      metalname
      metalcode
      ratescolumn
      metalpercent
      metalstatus
      createddate
    }
  }
`;
