export interface LoginFormInputs {
  username: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  data: {
    refreshToken: AuthTokens;
  };
}

export interface OtpForm {
  otp: string[];
}

export interface ForgotPasswordFormInput {
  email: string;
}
