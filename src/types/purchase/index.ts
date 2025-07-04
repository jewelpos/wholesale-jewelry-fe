export type PurchaseOrder = {
  ponumber: string;
  suppliername?: string;
  podate?: string;
  pototal?: number;
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
