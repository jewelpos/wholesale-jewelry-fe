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

export const REQUEST_PASSWORD_RESET_OTP_MUTATION = gql`
  mutation RequestPasswordResetOTP($email: String!) {
    requestPasswordResetOTP(email: $email) {
      success
      message
      error
    }
  }
`;

export const VERIFY_PASSWORD_RESET_OTP_MUTATION = gql`
  mutation VerifyPasswordResetOTP($email: String!, $otp: String!) {
    verifyPasswordResetOTP(email: $email, otp: $otp) {
      success
      message
      error
      data
    }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword) {
      success
      message
      error
    }
  }
`;

export const UPDATE_MY_PROFILE_MUTATION = gql`
  mutation UpdateMyProfile($userfullname: String!) {
    updateMyProfile(userfullname: $userfullname) {
      success
      message
      error
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($newPassword: String!) {
    changePassword(newPassword: $newPassword) {
      success
      message
      error
    }
  }
`;

export const GET_ACTIVE_USER_INFO_QUERY = gql`
  query GetActiveUserInfo {
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
        }
      }
    }
  }
`;

export const VERIFY_OTP_BY_EMAIL_MUTATION = gql`
  mutation VerifyOTPByEmail($email: String!, $otp: String!) {
    verifyOTPByEmail(email: $email, otp: $otp) {
      success
      message
      error
      data
    }
  }
`;

export const RESEND_MOBILE_OTP_WITH_EMAIL_MUTATION = gql`
  mutation ResendMobileOTPWithEmail($email: String!) {
    resendMobileOTPWithEmail(email: $email) {
      success
      message
      error
    }
  }
`;
