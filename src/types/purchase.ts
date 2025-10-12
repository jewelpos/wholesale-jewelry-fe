import dayjs from "dayjs";

export type PurchaseOrderInput = {
  storeid: number;
  supplierid: number;
  warehouseid: number;
  saveMode: string;
  podate?: string; // ISO Date string
  porequestdate?: string; // ISO Date string
  poconfirmedto?: string;
  poremarks?: string;
  poshippingmethod?: number;
  podiscount?: number;
  podiscountamt?: number;
  posubtotal?: number;
  pofreight?: number;
  posalestax?: number;
  podutypaid?: number;
  potax?: number;
  pototal?: number;
  termsid?: number;
  pomode?: number;
  rmano?: string;
  poordtocompanyname?: string;
  poordtoadd1?: string;
  poordtoadd2?: string;
  poordtocity?: string;
  poordtostate?: string;
  poordtozip?: string;
  poordtocountry?: string;
  poordtophone?: string;
  poshiptocompanyname?: string;
  poshiptoadd1?: string;
  poshiptoadd2?: string;
  poshiptocity?: string;
  poshiptostate?: string;
  poshiptozip?: string;
  poshiptocountry?: string;
  poshiptophone?: string;
  items: PurchaseOrderItemInput[];
};

export type PurchaseOrderItemInput = {
  itemid: number;
  itemcode: string;
  itemunit: string;
  qtyordered: number;
  orderunitcost: number;
  orddiscount: number;
};

// Form-specific type used by react-hook-form, keeps string/number flexibility for inputs
export type PurchaseOrderFormType = {
  storeid: number;
  supplierid: string | number;
  warehouseid: string | number;
  saveMode: string;
  podate?: dayjs.Dayjs;
  porequestdate?: dayjs.Dayjs;
  poconfirmedto?: string;
  poremarks?: string;
  poshippingmethod?: string | number;
  podiscount?: string | number;
  podiscountamt?: string | number;
  posubtotal?: string | number;
  pofreight?: string | number;
  posalestax?: string | number;
  podutypaid?: string | number;
  potax?: string | number;
  pototal?: string | number;
  termsid?: number;
  pomode?: number;
  rmano?: string;
  poordtocompanyname?: string;
  poordtoadd1?: string;
  poordtoadd2?: string;
  poordtocity?: string;
  poordtostate?: string;
  poordtozip?: string;
  poordtocountry?: string;
  poordtophone?: string;
  poshiptocompanyname?: string;
  poshiptoadd1?: string;
  poshiptoadd2?: string;
  poshiptocity?: string;
  poshiptostate?: string;
  poshiptozip?: string;
  poshiptocountry?: string;
  poshiptophone?: string;
  items: PurchaseOrderItemInput[];
};
