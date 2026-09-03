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
          issysgenmasteraccount
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

// Resolves a single already-known userid to a name, without the outlet-access
// restriction GET_USERS_LIST_QUERY applies — used only to label a value that's already
// set (e.g. a customer's default sales rep) when it belongs to an outlet outside the
// current picker's scope, never to populate a browsable list.
export const GET_USER_NAME_BY_ID_QUERY = gql`
  query GetUserNameById($storeid: Int!, $userid: Int!) {
    getUserNameById(storeid: $storeid, userid: $userid) {
      userid
      userfullname
      login
    }
  }
`;

export const GET_USERS_LIST_QUERY = gql`
  query GetUserListUnderStore($storeid: Int!, $outletid: Int, $includeAll: Boolean) {
    getUserListUnderStore(storeid: $storeid, outletid: $outletid, includeAll: $includeAll) {
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
      creationdatetime
      otpverified
      emailverified
      deletedat
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
          menuid
          iconurl
          menuurl
          menuname
          slugname
          menuorder
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
      outlets {
        outletid
        outletname
        isdefaultoutlet
      }
  }
}
`;
