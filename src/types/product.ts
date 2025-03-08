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

export type ProductListTypeResponseType = {
  total: number;
  data: ProductListType[];
};
