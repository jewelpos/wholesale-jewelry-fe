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

export type ProductFormType = {
  // Information Tab - Item Code/SKU Section
  itemcode: string;//Item Code/SKU
  itemdescription: string;//Item Description
  itemwarehouseid: number;
  
  // Information Tab - Supplier Detail Section
  supplierid: number | string;//Supplier ID
  supplieritemcode?: string;//Supplier Style #
  supplierbarcodeid?: string;//Supplier UPC #

  // Information Tab - Product Detail Section
  modelno?: string;//Model #
  manufacturer?: string;//Manufacturer
  itemreorderqtypnt?: number;//Item Reorder Point
  itemreorderqty?: number;//Item Order Quantity
  
  // Information Tab - Product Settings Section
  itemcategoryid: number;//Department
  subcategoryid?: number;//Product Line
  itemstatus: string;//Status
  itemtaxable: number;//Item Taxable
  trackinventory: number;//Non Inventory Item
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemimagepath?: any;//Photo
  itemlocation?: string;//Item Location
  
  // Information Tab - Sales Setting Section
  itempurchaseprice: number;//Unit Cost
  itemtagpricecode?: string;//Price Code
  itemtagprice?: number;//Tag Price
  itemdiscount?: number;//Item Discount
  itemmetal?: string;//Metal Type
  
  // Information Tab - General Setting Section
  itemremarks?: string;//Notes
  itemalertwarning?: number;//Item Alert
  itemwarningmessage?: string;//Alert Message
  detaileditemdescription?: string;//Detail Description
  
  // Information Tab - Tags Section
  tag1?: string;//Tag 1
  tag2?: string;//Tag 2
  tag3?: string;//Tag 3
  tag4?: string;//Tag 4
  tag5?: string;//Tag 5
  tag6?: string;//Tag 6
  tag7?: string;//Tag 7
  tag8?: string;//Tag 8
  tag9?: string;//Tag 9
  tag10?: string;//Tag 10
  
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
