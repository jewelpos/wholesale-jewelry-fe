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

export const TIME_FORMAT = "DD.MM.YYYY";
export const HEIGHT_BUFFER_SIZE = 300;

export const CHECK_STATUS = {
  ON_HAND_CHECK: "O/H",
  CHECK_ON_HOLD: "HLD",
  VOID_CHECK: "DEL",
  CANCEL_CHECK: "CNL",
  DEPOSITED_TO_BANK: "DEP",
  INSUFFICIENT_FUND: "NSF",
  CREDIT_ADJUSTMENT: "ADJ",
  WRITE_OFF_ADJUSTMENT: "OFF"
}

export const paymentModes = {
  CHECK: "Check",
  CASH: "Cash",
  CHARGE: "Charge",
  CASH_CHECK: "CashChk",
  MONEY_ORDER: "MnyOrd",
  CREDIT_INV: "CrdInv",
  WIRE_TRANSFER: "WireTrn",
  RE_DEPOSIT: "ReDep",
  NSF: "NSF",
  VOID: "Void",
  WRITE_OFF: "WriteOff",
};

export const paymentTypes ={
  voided:"voided",
  nonvoided:"nonvoided",
  all:"all",
}

export const paymentModalTypes = {
  add_credit_adjustment:"add_credit_adjustment",
  add_supplier_payment:"add_supplier_payment",
  add_void_payment:"add_void_payment",
}