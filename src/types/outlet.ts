export type CreateOutlet = {
  storeid: number;
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

export type OutletType = {
  outletId: number;
  storeId: number;
  outletName: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  storePhone: string;
  storeEmail: string;
  storeWebsite: string;
  contactPerson: string;
  storeLogo: string;
  createdDate: string;
  isEnabled: boolean;
  setupInventory: boolean;
  setupOutlet: boolean;
  setupProduct: boolean;
  setupReceipt: boolean;
  setupSalesTax: boolean;
  setupUsers: boolean;
};

export type OutletsType = OutletType[];
