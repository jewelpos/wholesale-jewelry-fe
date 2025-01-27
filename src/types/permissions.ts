type MenuAction = {
  actionid: number;
  actionname: string;
  actionorder: number;
  actionparentId: number;
  actiondescription: string;
  actiondisplayname: string;
};

type MenuChild = {
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
  menuId: string;
  iconUrl: string;
  menuUrl: string;
  children?: MenuChild[];
  menuName: string;
  slugName: string;
  menuOrder: number;
  storeTypeId: number;
};

export type Menus = Menu[];

export type permissions = {
  menus: Menus;
};
