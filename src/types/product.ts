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
  categoryname: string;
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
  itemcode?: string;
  itemid?: number;
  itemdescription?: string;
  itembarcodeid?: string;
  itemsellprice?: number;
  categoryname?: string;
  subcategoryname?: string;
  companyname?: string;
  supplier?: string;
  itemquantityinhand?: number;
  overall_qty?: number;
  totalsalevalue?: number;
  totalcostvalue?: number;
  itemlocation?: string;
  itemstatus?: string;
  itemimagepath?: string;
  warehousename?: string;
  outletid?: number;
  createddate?: string;
  lastmodifieddate?: string;
  itemwarehouseid?: number;
  memoqty?: number;
  soquantity?: number;
  lastsaledate?: string;
  lastpurchasedate?: string;
  totalqtypurchased?: number;
  calculatedavgcost?: number;
  qtypurchased?: number;
  avgpurchasecost?: number;
  availableqty?: number;
  totalsoldqty?: number;
  totalsoldpcs?: number;
  pcssold?: number;
  totalsoldvalue?: number;
  totalsoldcost?: number;
  totalsoldprofit?: number;
  itemaveragecost?: number;
  adjdate?: string;
  createdby?: string;
  modifiedby?: string;
  adjustedby?: string;
  lasttransferdate?: string;
  transferby?: string;
  itemunit?: string;
  itemmetal?: string;
  itemmetalpercent?: string;
  itempremium?: string;
  broakerage?: string;
  broakeragepercent?: number;
  hasbulkdiscount?: number;
  haspromotion?: number;
  hastransactions?: boolean;
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

export type ProductActivityChartPoint = {
  transation_date: string;
  transaction_type: string;
  quantity: number;
  reference: string;
  running_balance: number;
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

export type InventoryAdjustmentChartItem = {
  itemcode: string;
  description: string;
  total_qty_adjusted: number;
  total_cost_adjusted: number;
  adjustment_count: number;
};

export type InventoryAdjustmentChartResponse = {
  items: InventoryAdjustmentChartItem[];
  total_adjustments: number;
  total_qty: number;
  total_cost: number;
  items_affected: number;
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
  subcategoryid: number;//Product Line
  itemstatus: string;//Status
  itemunit: string;//Unit (Pc = pieces, Wt = weight)
  itemtaxable: number;//Item Taxable
  trackinventory?: number;//Non Inventory Item
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemimagepath: any;//Photo
  itemlocation?: string;//Item Location
  
  // Information Tab - Sales Setting Section
  itempurchaseprice: number;//Unit Cost
  itemsellprice?: number;//Sell Price (auto)
  itemtagpricecode?: string;//Price Code
  itemtagprice?: number;//Tag Price
  itemdiscount?: number;//Item Discount
  itemmetal?: string;//Metal Type
  itemmetalpercent?: string;//Metal %
  itempremium?: string;//Item Premium
  broakerage?: string;//Brokerage
  broakeragepercent?: number;//Brokerage %
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

  outletid?: number;
  fromoutletid?: number;
  tooutletid?: number;
  fromwarhouse?: number;
  towarehouse?: number;
  transferstatus?: string;
  transferstatusid?: number;
}

export type InventoryTransferItemInput = {
  itemid: number;
  transferquantity: number;
};

export type InventoryTransferInput = {
  storeid: number;
  outletid: number;
  transfermode: string;
  fromwarehouse: number;
  towarehouse: number;
  remarks?: string;
  items: InventoryTransferItemInput[];
};

export type InventoryReceiveInput = {
  storeid: number;
  outletid: number;
  towarehouse: number;
  remarks?: string;
  items: InventoryTransferItemInput[];
};

export type UpdateInventoryTransferStatusInput = {
  storeid: number;
  inventoryitemtransferid: number;
  transferstatusid: number;
};

export type ReceiveInventoryTransferItemInput = {
  inventoryitemtransferdetailid: number;
  quantityreceived: number;
  itemreceived: boolean;
};

export type ReceiveInventoryTransferInput = {
  storeid: number;
  inventoryitemtransferid: number;
  items: ReceiveInventoryTransferItemInput[];
};

export type TransferStatus = {
  transferstatusid: number;
  statusname?: string;
};

export type InventoryItemTransfer = {
  inventoryitemtransferid?: number;
  transfermode?: string;
  transfersource?: string;
  destination?: string;
  transfertype?: string;
  totalitemtransfered?: number;
  totalquantities?: number;
  username?: string;
  transferdatetime?: string;
  remarks?: string;
  warehousename?: string;
  warehouseid?: number;
  outletid?: number;
  fromoutletid?: number;
  tooutletid?: number;
  fromwarhouse?: number;
  towarehouse?: number;
  transferstatus?: string;
  transferstatusid?: number;
};

export interface ProductSettingsInfo {
  codechars: {
    [key: string]: string;
  };
  saletagkey: number;
  tagpricekey: number;
  allowpcsentry: boolean;
  allowcarriage: boolean;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  productid: any;
  newquantity?: number;
  newcost?: number;
  updateremarks: string;
}

export interface InventoryItemTransferDetail {
  inventoryitemtransferdetailid?: number;
  inventoryitemtransferid?: number;

  itemcode?: string;
  itemdescription?: string;

  transferquantity?: number;
  transferdate?: string; // DateTime
  username?: string;

  warehousename?: string;
  transferbyid?: number;
  warehouseid?: number;

  lastmodifieddate?: string; // DateTime

  quantityreceived?: number;
  receiveddate?: string; // DateTime
  receivedbyid?: number;

  itemreceived?: boolean;
}

export type ItemAgingSummary = {
  itemid: number;
  itembarcodeid: number;
  itemcode: string;
  itemdescription: string;
  supplier: string;
  warehousename: string;
  itemquantityinhand: number;
  unit_cost: number;
  total_cost: number;
  last_inbound_date: string;
  age_days: number;
  inbound_aging_bucket: string;
  last_sale_date: string;
  last_sale_days: number;
  sales_aging_bucket: string;
  sale_price: number;
  total_sale_value: number;
  warehouseid: number;
  outletid: number;
};

// --- Inventory Matrix (Pivot) types ---

export type WarehouseMatrixColumn = { warehouseid: number; warehousename: string };
export type OutletMatrixColumn = { outletid: number; outletname: string; warehouses: WarehouseMatrixColumn[] };

export type WarehouseMatrixQty = {
  warehouseid: number;
  onhandqty: number;
  availableqty: number;
  soldqty: number | null;
};

export type OutletMatrixQty = {
  outletid: number;
  onhandqty: number;
  availableqty: number;
  soldqty: number | null;
  warehouses: WarehouseMatrixQty[];
};

export type InventoryMatrixRow = {
  itemcode: string;
  itemdescription: string;
  categoryname: string;
  subcategoryname: string;
  itemunit: string;
  overall_qty: number;
  avg_daily_sales: number;
  reorderpoint: number | null;
  maxstock: number | null;
  outlets: OutletMatrixQty[];
};

export type InventoryMatrixTotals = {
  overall_qty: number;
  outlets: OutletMatrixQty[];
};

export type InventoryMatrixUnitTotals = {
  itemunit: string;
  itemcount: number;
  overall_qty: number;
  outlets: OutletMatrixQty[];
};

export type InventoryMatrixResponse = {
  total: number;
  columns: OutletMatrixColumn[];
  data: InventoryMatrixRow[];
  totalsRows: InventoryMatrixUnitTotals[];
};

export type MatrixMetricMode = "onhand" | "available" | "days_of_stock" | "sold_qty";
export type MatrixThresholdMode = "range" | "reorder_point";