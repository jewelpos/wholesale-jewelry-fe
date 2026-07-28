export type MenuAction = {
  actionid: number;
  actionname: string;
  actionorder: number;
  actionparentid: number;
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
  permissionname: string;
  permissiondisplayname: string;
  permissiondescription: string;
  parentid: number;
  storemenuid: number;
  permissionorder: number;
  storetypeid: number;
  packageid: string;
  permissionparentid: number;
  rolesnotallowed: number[];
  action: AddUserMenuAction[];
  status?: "SELECTED" | "SELECTABLE" | "NOT_ALLOWED";
};

export type AddUserMenuType = {
  permissiondisplayname: string;
  // The section's storemenu.menuid — derived (both on the candidate list and on
  // save) from the storemenu PARENT of each child permission's own storemenu row,
  // never from permissions.permissionid or permissiondisplayname. Those live in a
  // separate, independently-numbered/named hierarchy that only coincidentally
  // lines up with storemenu for a few sections, so matching on them silently
  // breaks header-to-header matching for every other section.
  permissionid: number | null;
  storetypeid: number;
  children: AddUserMenuChildType[];
};

export type AddUserMenusType = AddUserMenuType[];

export type AddUserPermissionType = {
  roleid: number;
  menus: AddUserMenusType;
};

export type UsersListChildMenuType = {
  name: string;
  action: MenuAction[];
  storemenuid: number;
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

export type UsersListMenuType = {
  menuid: number;
  iconurl: string;
  menuurl: string;
  menuname: string;
  slugname: string;
  menuorder: number;
  storetypeid: number;
  permissionid: number | null;
  permissiondisplayname: string;
  children: UsersListChildMenuType[];
};

export type UsersListPermissionType = {
  roleid: number;
  rolename: string;
  menus: UsersListMenuType[];
};
