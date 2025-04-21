import { gql } from "@apollo/client";

export const DELETE_SALES_ORDER_MUTATION = gql`
  mutation DeleteSalesOrder($salesorderno: String!, $outletid: Int!) {
    deleteSalesOrder(salesorderno: $salesorderno, outletid: $outletid) {
      success
      message
      error
      data
    }
  }
`;

export const DELETE_SALE_MUTATION = gql`
  mutation DeleteSalesOrder($salesorderno: String!, $outletid: Int!) {
    deleteSalesOrder(salesorderno: $salesorderno, outletid: $outletid) {
      success
      message
      error
      data
    }
  }
`;
