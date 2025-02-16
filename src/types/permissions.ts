type MenuAction = {
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

type Menu = {
  menuid: string;
  iconurl: string;
  menuurl: string;
  children?: MenuChild[];
  menuname: string;
  slugname: string;
  menuorder: number;
  storetypeid: number;
};

export type Menus = Menu[] | undefined;

export type permissions = {
  menus: Menus;
};

type AddUserMenuChildType = {
  action: MenuAction[];
  menuid: number;
  parentid: number;
  storetypeid: number;
  permissionparentid: number;
};

type AddUserMenuType = {
  menuid: string;
  children?: AddUserMenuChildType[];
  storetypeid: number;
};

export type AddUserPermissionType = {
  roleid: number;
  menus: AddUserMenuType[];
};
