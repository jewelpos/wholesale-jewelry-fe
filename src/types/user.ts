import { permissions } from "./permissions";

export interface activeUser {
  name: string;
  email: string;
  phone: string;
  username: string;
  role: string;
  roleid: number;
  otpverified: boolean;
  emailverified: boolean;
  isenabled: boolean;
  shouldcreatestore: boolean;
  permissions: permissions;
}
