import { permissions } from "./permissions";

export interface activeUser {
  name: String;
  email: String;
  phone: String;
  username: String;
  role: String;
  roleid: any;
  otpverified: Boolean;
  emailverified: Boolean;
  isenabled: Boolean;
  shouldcreatestore: Boolean;
  permissions: permissions;
}
