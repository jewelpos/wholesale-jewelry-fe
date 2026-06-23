import { gql } from "@apollo/client";

const PROMOTION_ITEM_FIELDS = `
  promotionitemid
  promotionid
  itemid
  categoryid
  pricerangemin
  pricerangemax
  requiredquantity
  discountamount
  discounttype
  itemname
  categoryname
`;

export const GET_PROMOTION_LIST_QUERY = gql`
  query GetPromotionList($storeid: Int!, $warehouseid: Int) {
    getPromotionList(storeid: $storeid, warehouseid: $warehouseid) {
      promotionid
      promotionname
      promotiontype
      startdate
      enddate
      isactive
      description
      warehouseid
      items {
        ${PROMOTION_ITEM_FIELDS}
      }
    }
  }
`;

export const GET_PROMOTION_QUERY = gql`
  query GetPromotion($storeid: Int!, $promotionid: Int!) {
    getPromotion(storeid: $storeid, promotionid: $promotionid) {
      promotionid
      promotionname
      promotiontype
      startdate
      enddate
      isactive
      description
      warehouseid
      items {
        ${PROMOTION_ITEM_FIELDS}
      }
    }
  }
`;
