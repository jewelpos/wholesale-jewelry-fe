import { gql } from "@apollo/client";

export const CREATE_OUTLET_USER_MUTATION = gql`
  mutation CreateOutletUser($input: CreateOutletUserInput!) {
    createOutletUser(createOutletUserInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const EDIT_OUTLET_USER_MUTATION = gql`
  mutation EditOutletUser($input: EditOutletUserInput!) {
    editOutletUser(editOutletUserInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const RESEND_USER_VERIFICATION_OTP_MUTATION = gql`
  mutation ResendUserVerificationOTP($userid: Int!) {
    resendUserVerificationOTP(userid: $userid) {
      success
      message
      error
    }
  }
`;

export const RESEND_USER_VERIFICATION_EMAIL_MUTATION = gql`
  mutation ResendUserVerificationEmail($userid: Int!) {
    resendUserVerificationEmail(userid: $userid) {
      success
      message
      error
    }
  }
`;
