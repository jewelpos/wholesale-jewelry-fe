import { gql } from "@apollo/client";

export const GET_PERMISSION_QUERY = gql`
  query GetPermissionList($storeid: Int!, $roleid: Int!) {
    getPermissionList(storeid: $storeid, roleid: $roleid) {
      success
      message
      error
      data
    }
  }
`;
