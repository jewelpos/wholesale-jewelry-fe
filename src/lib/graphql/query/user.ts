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
