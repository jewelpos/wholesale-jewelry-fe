import { gql } from "@apollo/client";

export const CREATE_PROMOTION_MUTATION = gql`
  mutation CreatePromotion($storeid: Int!, $input: CreatePromotionInput!) {
    createPromotion(storeid: $storeid, input: $input) {
      success
      message
      error
    }
  }
`;

export const UPDATE_PROMOTION_MUTATION = gql`
  mutation UpdatePromotion($storeid: Int!, $input: UpdatePromotionInput!) {
    updatePromotion(storeid: $storeid, input: $input) {
      success
      message
      error
    }
  }
`;

export const DELETE_PROMOTION_MUTATION = gql`
  mutation DeletePromotion($storeid: Int!, $promotionid: Int!) {
    deletePromotion(storeid: $storeid, promotionid: $promotionid) {
      success
      message
      error
    }
  }
`;

export const TOGGLE_PROMOTION_ACTIVE_MUTATION = gql`
  mutation TogglePromotionActive($storeid: Int!, $promotionid: Int!, $isactive: Int!) {
    togglePromotionActive(storeid: $storeid, promotionid: $promotionid, isactive: $isactive) {
      success
      message
      error
    }
  }
`;
