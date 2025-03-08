export type MenuAction = {
  actionid: number;
  actionname: string;
  actionorder: number;
  actionparentId: number;
  actiondescription: string;
  actiondisplayname: string;
};

export type MenuChild = {
  name: string;
  action: MenuAction[];
  menuid: number;
  roleid: string;
  iconurl: string;
  menuurl: string;
  menuname: string;
  parentid: number;
  slugname: string;
  menuorder: number;
  storetypeid: number;
  permissionid: number;
  permissionname: string;
  permissionorder: number;
  permissionparentid: number;
  permissiondescription: string;
  permissiondisplayname: string;
  children?: MenuChild[];
};

export type Menu = {
  action: any;
  menuid: number;
  iconurl: string;
  menuurl: string;
  children?: MenuChild[];
  menuname: string;
  slugname: string;
  menuorder: number;
  storetypeid: number;
};

export type Menus = Menu[];

export type permissions = {
  map(arg0: (menu: Menu) => import("react").JSX.Element): unknown;
  menus: Menus;
};

export type AddUserMenuAction = {
  actionid: number;
  actionname: string;
  actiondisplayname: string;
  actiondescription: string;
  actionorder: number;
  actionparentid: number;
};

export type AddUserMenuChildType = {
  permissionid: number;
  permissionname: number;
  permissiondisplayname: string;
  permissiondescription: string;
  parentid: number;
  storemenuid: number;
  permissionorder: number;
  storetypeid: number;
  packageid: number;
  permissionparentid: number;
  rolesnotallowed: number;
  action: AddUserMenuAction[];
  status?: "SELECTED" | "SELECTABLE" | "NOT_ALLOWED";
};

type AddUserMenuType = {
  permissiondisplayname: string;
  permissionid: number;
  storetypeid: number;
  children: AddUserMenuChildType[];
};

export type AddUserMenusType = AddUserMenuType[];

export type AddUserPermissionType = {
  roleid: number;
  menus: AddUserMenusType;
};

type UsersListChildMenuType = {
  name: string;
  action: MenuAction[];
  menuid: number;
  roleid: number;
  iconurl: string;
  menuurl: string;
  menuname: string;
  parentid: number;
  slugname: string;
  menuorder: number;
  packageid: string;
  storetypeid: number;
  permissionid: number;
  permissionname: string;
  permissionorder: number;
  permissionparentid: number;
  permissiondescription: string;
  permissiondisplayname: string;
};

type UsersListMenuType = {
  menuid: number;
  iconurl: string;
  menuurl: string;
  menuname: string;
  slugname: string;
  menuorder: number;
  storetypeid: number;
  children: UsersListChildMenuType[];
};

export type UsersListPermissionType = {
  roleid: number;
  rolename: string;
  menus: UsersListMenuType[];
};
