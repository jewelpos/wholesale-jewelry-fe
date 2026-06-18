import { gql } from "@apollo/client";

export const OPEN_CASH_DRAWER_MUTATION = gql`
  mutation OpenCashDrawer($storeid: Int!, $outletid: Int!, $openingfloat: Float!, $date: String) {
    openCashDrawer(storeid: $storeid, outletid: $outletid, openingfloat: $openingfloat, date: $date) {
      id outletid date openedby openingfloat expectedclosing actualclosing variance status notes openedat closedat
    }
  }
`;

export const CLOSE_CASH_DRAWER_MUTATION = gql`
  mutation CloseCashDrawer($storeid: Int!, $outletid: Int!, $actualclosing: Float!, $notes: String, $date: String) {
    closeCashDrawer(storeid: $storeid, outletid: $outletid, actualclosing: $actualclosing, notes: $notes, date: $date) {
      id outletid date openedby openingfloat expectedclosing actualclosing variance status notes openedat closedat
    }
  }
`;
