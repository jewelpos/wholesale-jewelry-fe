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
