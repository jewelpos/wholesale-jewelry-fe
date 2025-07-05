export type ProductItemCategoryType = {
  categoryid: number;
  categoryname: string;
  categorydescription: string;
  categorycode: string;
  categorycodenextid: number;
  warehousename: string;
  warehouseid: number;
  outletid: number;
  createdby: string;
  createddate: string;
  lastmodifieddate: string;
};

export type ProductItemCategoryResponseType = {
  total: number;
  data: ProductItemCategoryType[];
};

export type ProductSubItemCategoryType = {
  subcategoryid: number;
  subcategoryname: string;
  subcategorydescription: string;
  categoryid: number;
  warehousename: string;
  createdby: string;
  warehouseid: number;
  outletid: number;
  createddate: string;
  lastmodifieddate: string;
};

export type ProductSubItemCategoryResponseType = {
  total: number;
  data: ProductSubItemCategoryType[];
};

export type ProductListType = {
  itemcode: string;
  itemdescription: string;
  itembarcodeid: string;
  itemsellprice: number;
  categoryname: string;
  subcategoryname: string;
  companyname: string;
  itemquantityinhand: number;
  overall_qty: number;
  lastsaledate: string;
  itemlocation: string;
  itemstatus: string;
  itemimagepath: string;
  warehousename: string;
  itemwarehouseid: number;
  outletid: number;
};

export type ProductListTypeResponseType = {
  total: number;
  data: ProductListType[];
};

export type ProductActivityList = {
  itemcode: string;
  transaction_type: string;
  transation_date: string;
  reference: string;
  quantity: number;
  warehouse: string;
  warehouseid: number;
};

export type ProductActivityListResponseType = {
  total: number;
  data: ProductActivityList[];
};

export type InventoryAdjustment = {
  itemcode: string;
  description?: string;
  adjusted_date?: string;
  qty_adjusted?: number;
  cost_adjusted?: number;
  new_qty?: number;
  new_cost?: number;
  updated_by?: string;
  warehouse?: string;
  adj_id?: number;
  itemid?: number;
  lastmodifieddate?: string;
  warehouseid?: number;
  updateremarks?: string;
};

export type InventoryAdjustmentResponseType = {
  total: number;
  data: InventoryAdjustment[];
};
