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
      id
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

export const GET_USER_QUERY = gql`
  query GetUserByIdUnderStore($id: Int!) {
    getUserByIdUnderStore(id: $id) {
      id
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
          storetypeid
          permissionid
          permissiondisplayname
          children {
            action {
              actionid
              actionname
              actionorder
              actionparentid
              actiondescription
              actiondisplayname
            }
            parentid
            packageid
            storetypeid
            permissionid
            permissionname
            permissionorder
            permissionparentid
            permissiondescription
            permissiondisplayname
            status
            storemenuid
          }
        }
      }
      roleid
      rolename
      outletid
      outletname
      storename
      isdefaultoutlet
  }
}
`;
