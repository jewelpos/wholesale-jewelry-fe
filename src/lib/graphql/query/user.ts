import { gql } from "@apollo/client";

export const GET_ACTIVE_USER = gql`
  query {
    getActiveUserInfo {
      success
      message
      error
      data {
        user {
          name
          email
          phone
          username
          role
          roleid
          otpverified
          emailverified
          isenabled
          shouldcreatestore
          permissions
        }
      }
    }
  }
`;

export const GET_USERS_LIST_QUERY = gql`
  query GetUserListUnderStore($storeid: Int!) {
    getUserListUnderStore(storeid: $storeid) {
      userid
      userfullname
      emailaddress
      userphone
      login
      isenabled
      userpermissions {
        roleid
        rolename
        menus {
          menuid
          iconurl
          menuurl
          menuname
          slugname
          menuorder
          storetypeid
          children {
            name
            action {
              actionname
            }
          }
        }
      }
      roleid
      rolename
      outletid
      outletname
    }
  }
`;
