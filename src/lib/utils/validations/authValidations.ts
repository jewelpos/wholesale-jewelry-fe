export const emailValidation = {
  required: "Email is required",
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: "Invalid email address",
  },
};

export const emailOrUsernameValidation = (value: string) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernamePattern = /^[a-zA-Z0-9_-]{3,20}$/;
  if (emailPattern.test(value) || usernamePattern.test(value)) {
    return true;
  }
  return "Please enter a valid email or username";
};

export const passwordValidation = {
  required: "Password is required",
  validate: {
    length: (value: string) =>
      value.length >= 8 || "Password must be at least 6 characters long",

    uppercase: (value: string) =>
      /[A-Z]/.test(value) ||
      "Password must contain at least one uppercase letter",

    lowercase: (value: string) =>
      /[a-z]/.test(value) ||
      "Password must contain at least one lowercase letter",

    digit: (value: string) =>
      /\d/.test(value) || "Password must contain at least one digit",

    specialChar: (value: string) =>
      /[!@#$%^&*(),.?":{}|<>]/.test(value) ||
      "Password must contain at least one special character",
  },
};
