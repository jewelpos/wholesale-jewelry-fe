import { gql } from '@apollo/client';

export const GET_INVENTORY_ITEMS_BY_ITEMCODES = gql`
  query GetInventoryItemsByItemCodes($storeid: Int!, $itemcodes: [String!]!) {
    getInventoryItemsByItemCodes(storeid: $storeid, itemcodes: $itemcodes) {
      itemid
      itemcode
      itemdescription
      itemunit
    }
  }
`;

export const CHECK_IMPORT_ITEMCODES_ON_RECENT_POS = gql`
  query CheckImportItemcodesOnRecentPOs($storeid: Int!, $itemcodes: [String!]!, $dayslookback: Int!) {
    checkImportItemcodesOnRecentPOs(storeid: $storeid, itemcodes: $itemcodes, dayslookback: $dayslookback) {
      itemcode
      ponumber
      podate
    }
  }
`;

export const GET_IMPORT_MAPPING_TEMPLATES = gql`
  query GetImportMappingTemplates($storeid: Int!) {
    getImportMappingTemplates(storeid: $storeid) {
      templateid
      templatename
      mappingconfig
    }
  }
`;

export const GET_IMPORT_HISTORY = gql`
  query GetImportHistory($storeid: Int!) {
    getImportHistory(storeid: $storeid) {
      importid
      filename
      importedby
      importedat
      recordcount
    }
  }
`;
