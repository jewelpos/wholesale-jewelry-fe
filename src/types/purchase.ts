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
  posales?: number;
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
  pototalwithoutdiscount: number;
};

export type EditPurchaseOrderInput = {
  storeid: number;
  ponumber: number;
  supplierid: number;
  warehouseid: number;
  saveMode: string;
  podate?: string; // ISO Date string
  porequestdate?: string; // ISO Date string
  poconfirmedto?: string;
  poremarks?: string;
  poshippingmethod?: string;
  podiscount?: number;
  podiscountamt?: number;
  posubtotal?: number;
  pofreight?: number;
  posalestax?: number;
  podutypaid?: number;
  posales?: number;
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
  postatus?: number;
  items: PurchaseOrderItemInput[];
  removeItemIds?: number[];
  pototalwithoutdiscount: number;
};

export type PurchaseOrderItemInput = {
  poitemid?: number;
  itemid?: number;
  itemcode: string | number;
  itemdescription?: string;
  itemunit: string;
  qtyordered: number;
  itemqtyreceived?: number;
  itemqtybackorder?: number;
  orderunitcost: number;
  orddiscount: number;
  ordextendedprice: number;
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
  posales?: string | number;
  pototal?: string | number;
  pototalwithoutdiscount?: string | number;
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
  postatus?: string | number;
  items: PurchaseOrderItemInput[];
};

export type PurchaseOrder = {
  ponumber: string;
  suppliername?: string;
  podate?: string;
  pototal?: number;
  pototalwithoutdiscount?: number;
  status?: string;
  terms?: string;
  shippingmethod?: string;
  warehouse?: string;
  createdby?: string;
  lastmodifieddate?: string;
  podiscount?: number;
  posubtotal?: number;
  podiscountamt?: number;
  pofreight?: number;
  podutypaid?: number;
  posalestax?: number;
  poconfirmedto?: string;
  porequestdate?: string;
  poshiptocompanyname?: string;
  pomode?: string;
  rmano?: string;
  supplierid?: number;
  pocreatebyid?: number;
  postatus?: number;
  warehouseid?: number;
  termsid?: number;
};

export type PurchaseOrderResponseType = {
  total: number;
  data: PurchaseOrder[];
};

export type PurchaseOrderItem = {
  poitemid: number;
  ponumber: string;
  itemcode: string;
  itemdescription?: string;
  qtyordered?: number;
  itemqtyreceived?: number;
  itemqtybackorder?: number;
  orderunitcost?: number;
  orddiscount?: number;
  ordextendedprice?: number;
  lastmodifieddate?: string;
  status?: string;
  suppliername?: string;
  warehouse?: string;
  pobackorderadjusteddate?: string;
  adjustedby?: string;
};

export type PurchaseOrderItemResponseType = {
  total: number;
  data: PurchaseOrderItem[];
};

export type ReceivePOItemInput = {
  poitemid: number;
  qtyToReceive: number;
};

export type ReceivePurchaseOrderInput = {
  storeid: number;
  ponumber: number;
  postingdate?: string; // DateTime
  items: ReceivePOItemInput[];
};

export type Status = {
  statusid: number;
  statusname?: string;
  description?: string;
};
