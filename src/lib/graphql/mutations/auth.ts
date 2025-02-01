import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      success
      message
      error
      data
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      success
      message
      error
      data {
        accessToken
        refreshToken
      }
    }
  }
`;
