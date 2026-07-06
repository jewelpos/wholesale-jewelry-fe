import { MultiValue } from "react-select";
import {
  AddUserPermissionType,
  permissions,
  UsersListPermissionType,
} from "./permissions";
import { SelectOption } from "./form";

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

export type AddUserPermittedMenu = {
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
  outlets: MultiValue<SelectOption>;
  roleid: number;
  defaultoutletid: number;
};

export type UsersListType = {
  id: number;
  userid: number;
  userfullname: string;
  emailaddress: string;
  userphone: string;
  login: string;
  isenabled: number;
  userpermissions: UsersListPermissionType;
  roleid: number;
  rolename: string;
  outletid: number;
  outletname: string;
  storename: string;
  isdefaultoutlet: boolean;
  creationdatetime: string | null;
  otpverified: number;
  emailverified: number;
  deletedat: string | null;
};
