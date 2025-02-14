export type CreateStore = {
  storetypeid?: number;
  outletname: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  storephone: string;
  storeemail: string;
  contactperson: string;
};

export type StoreCategory = {
  name: string;
  id: number;
};

export type GetStoreCategoryData = {
  getStoreCategory: StoreCategory[];
};

export type Store = {
  storeid: number | string;
  creationdatetime: string;
  isenabled: number;
  storecategoryid: number;
  storename: string;
  institutionid: number;
  hassetupoutlet: boolean;
  hassetupusers: boolean;
  hassetupsalestax: boolean;
  hassetupinventory: boolean;
  hassetupproduct: boolean;
  hassetupreceipt: boolean;
};

export type Stores = Store[];

export type CreateSingleStore = {
  storename: string;
  categoryid: number;
};
