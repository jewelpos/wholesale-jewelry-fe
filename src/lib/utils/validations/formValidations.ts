export const phoneNumberValidation = {
  required: "Store Phone is required",
  pattern: {
    value: /^[0-9]+$/,
    message: "Phone number must contain only digits",
  },
  minLength: {
    value: 10,
    message: "Phone number must be exactly 10 digits",
  },
  maxLength: {
    value: 10,
    message: "Phone number must be exactly 10 digits",
  },
};
