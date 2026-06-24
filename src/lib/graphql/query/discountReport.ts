import { gql } from "@apollo/client";

export const GET_DISCOUNT_REPORT_QUERY = gql`
  query GetDiscountReport($storeid: Int!, $fromdate: String!, $todate: String!, $warehouseid: Int) {
    getDiscountReport(storeid: $storeid, fromdate: $fromdate, todate: $todate, warehouseid: $warehouseid) {
      lines {
        invoicedate
        invoicenumber
        custcompanyname
        itemcode
        itemdescription
        discountsource
        discountpromotionid
        promotionname
        discountpercent
        discountamount
        netamount
        warehousename
      }
      summary {
        discountsource
        totallines
        totaldiscountamount
      }
    }
  }
`;
