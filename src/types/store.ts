export type Store = {
  storetypeid: number;
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
