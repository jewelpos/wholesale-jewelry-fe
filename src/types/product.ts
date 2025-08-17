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
  itemid: number;
  itemcode: string;
  itemdescription: string;
  itembarcodeid: string;
  itemsellprice: number;
  categoryname: string;
  subcategoryname: string;
  companyname: string;
  itemquantityinhand: number;
  memoqty: number;
  soquantity: number;
  availableqty: number;
  overall_qty: number;
  lastsaledate: string;
  lastpurchasedate: string;
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
  itemdescription: string;
  transaction_type: string;
  transation_date: string;
  reference: string;
  quantity: number;
  salesperson: string;
  warehouse: string;
  itemid: number;
  itembarcodeid: string;
  warehouseid: number;
  outletid: number;
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

export type ProductFormType = {
  // Information Tab - Item Code/SKU Section
  itemcode: string;//Item Code/SKU
  itemdescription: string;//Item Description
  itemwarehouseid: number;
  
  // Information Tab - Supplier Detail Section
  supplierid: number | string;//Supplier ID
  
  // Information Tab - Product Settings Section
  itemcategoryid: number;//Department
  subcategoryid?: number;//Product Line
  itemstatus: string;//Status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemimagepath?: any;//Photo
  
  // Information Tab - Sales Setting Section
  itempurchaseprice: number;//Unit Cost
  itemtagprice?: number;//Tag Price
  profitpercent: number; //Profit Percent
  
  // Information Tab - General Setting Section
  itemremarks?: string;//Notes
  itemalertwarning?: number;//Item Alert
  itemwarningmessage?: string;//Alert Message
  detaileditemdescription?: string;//Detail Description
  
  // Stone Details Tab
  dshape?: string;//Shape
  dlab?: string;//Laboratory
  dcerno?: string;//Certificate #
  dcarat?: number;//Carat Weight
  ddiameter?: string;//Diameter
  dcolor?: string;//Color
  dclarity?: string;//Clarity
  dflorence?: string;//Flourescence
  dpolarity?: string;//Polarity
  ddepth?: string;//Depth
  dtable?: string;//Table
  dgirdle?: string;//Girdle
  dculut?: string;//Culet
  dpolish?: string;//Polish
  dsymmetry?: string;//Symmetry
  dcrownheight?: string;//Crown Height
  dcrownangle?: string;//Crown Angle
  dpavillionheight?: string;//Pavillion Height
  dpavillionangle?: string;//Pavillion Depth
  dmesurement?: string;//Measurement LxWxD 
  dsize?: string;//Size in mm
  dquality?: string;//Quality
  dstockno?: string;//Stock Number
  drapprice?: number;//Rapaport Price
  dcost?: number;//Cost Per Carat
  dsaleprice?: number;//Sell Price Per Carat
  dpricecode?: string;//Price Code
  
  // System fields
  itemid?: number;
  storeid: number
};

export interface InventoryTransfer {
  inventoryitemtransferid: number;
  transfermode: string;
  transfersource: string;
  destination: string;
  transfertype: string;
  totalitemtransfered: number;
  totalquantities: number;
  username: string;
  transferdatetime: string;
  remarks: string;
  warehousename: string;
  warehouseid: number;
}

export interface ProductSettingsInfo {
  codechars: {
    [key: string]: string;
  };
  saletagkey: number;
  tagpricekey: number;
}

export interface Category {
  categoryid: number;
  categoryname: string;
  categorydescription: string;
  categorycode: string;
  warehouseid: number;
  storeid: number;
}

export interface AddCategoryInput {
  categoryname: string;
  categorydescription?: string;
  categorycode?: string;
  warehouseid: number;
  storeid: number;
}

export interface EditCategoryInput {
  categoryid: number;
  categoryname?: string;
  categorydescription?: string;
  categorycode?: string;
  warehouseid?: number;
  storeid: number;
}

export interface Subcategory {
  subcategoryid: number;
  subcategoryname: string;
  subcategorydescription: string;
  categoryid: number;
  warehouseid: number;
  storeid: number;
}

export interface AddSubcategoryInput {
  subcategoryname: string;
  subcategorydescription?: string;
  categoryid: number;
  warehouseid: number;
  storeid: number;
}

export interface EditSubcategoryInput {
  subcategoryid: number;
  subcategoryname?: string;
  subcategorydescription?: string;
  categoryid?: number;
  warehouseid?: number;
  storeid: number;
}

export interface AdjustProductInput {
  storeid: number;
  warehouseid: number;
  productid: number;
  newquantity?: number;
  newcost?: number;
  updateremarks: string;
}

export interface InventoryItemTransferDetail {
  inventoryitemtransferdetailid: number;
  inventoryitemtransferid: number;
  itemcode: string;
  itemdescription: string;
  transferquantity: number;
  transferdate: string;
  username: string;
  warehousename: string;
  transferbyid: number;
  warehouseid: number;
  lastmodifieddate: string;
}
