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
  outletid: number;
  storeid: number;
  outletname: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  storephone: string;
  storeemail: string;
  storewebsite: string;
  contactperson: string;
  storelogo: string;
  createddate: string;
  isenabled: boolean;
  setupinventory: boolean;
  setupoutlet: boolean;
  setupproduct: boolean;
  setupreceipt: boolean;
  setupsalestax: boolean;
  setupusers: boolean;
};

export type OutletsType = OutletType[];
