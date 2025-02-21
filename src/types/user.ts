import { AddUserPermissionType, permissions } from "./permissions";

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

export type AddUserType = {
  emailaddress: string;
  password: string;
  userphone: string;
  userfullname: string;
  storeid: number;
  outletid: number;
  roleid: number;
  permissions: AddUserPermissionType;
};

type Menu = {
  permissionid: number;
  parentid: number;
};

export type AddUserFormType = {
  emailaddress: string;
  password: string;
  confirmpassword: string;
  userphone: string;
  userfullname: string;
  storeid: number;
  outletid: number;
  roleid: number;
  menus: Menu[];
};
