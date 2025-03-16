export const APP_CONSTANTS = {
  api: {
    RETRY_COUNT: 3,
    TIMEOUT: 30000,
  },
  auth: {
    COOKIE_PREFIX:
      process.env.NEXT_PUBLIC_ENV === "production" ? "__Secure-" : "",
    ACCESS_TOKEN_KEY: "access-token",
    REFRESH_TOKEN_KEY: "refresh-token",
  },
  routes: {
    AUTH: {
      LOGIN: "/login",
      REGISTER: "/register",
      FORGOT_PASSWORD: "/forgot-password",
    },
    APP: {
      DASHBOARD: "/dashboard",
      PROFILE: "/profile",
      SETTINGS: "/settings",
    },
  },
};

export const NOTIFICATION_TYPES = {
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
  WARNING: "WARNING",
  INFO: "INFO",
};

export const MENU_STATUS_TYPES = {
  SELECTED: "SELECTED",
  SELECTABLE: "SELECTABLE",
  NOT_ALLOWED: "NOT_ALLOWED",
};

export const TIME_FORMAT = "DD.MM.YYYY [at] HH:mm";
export const HEIGHT_BUFFER_SIZE = 300;