import { gql } from '@apollo/client';

export const SAVE_IMPORT_MAPPING_TEMPLATE = gql`
  mutation SaveImportMappingTemplate($storeid: Int!, $templatename: String!, $mappingconfig: String!) {
    saveImportMappingTemplate(storeid: $storeid, templatename: $templatename, mappingconfig: $mappingconfig) {
      templateid
      templatename
      mappingconfig
    }
  }
`;

export const DELETE_IMPORT_MAPPING_TEMPLATE = gql`
  mutation DeleteImportMappingTemplate($storeid: Int!, $templateid: Int!) {
    deleteImportMappingTemplate(storeid: $storeid, templateid: $templateid)
  }
`;

export const SAVE_IMPORT_FILE_RECORD = gql`
  mutation SaveImportFileRecord($storeid: Int!, $filename: String!, $importedby: Int!, $recordcount: Int!) {
    saveImportFileRecord(storeid: $storeid, filename: $filename, importedby: $importedby, recordcount: $recordcount)
  }
`;
