import { HideableFieldDef, STONE_DETAILS_SECTION_KEY } from "./types";

export const PRODUCT_HIDEABLE_FIELDS: HideableFieldDef[] = [
  { key: "subcategoryid", label: "Sub Category", section: "Product Identity" },
  { key: "supplieritemcode", label: "Supplier Item Code", section: "Product Identity" },
  { key: "supplierbarcodeid", label: "Supplier Barcode", section: "Product Identity" },
  { key: "itemmetal", label: "Metal", section: "Metal & Making Charges" },
  { key: "itemmetalpercent", label: "Metal %", section: "Metal & Making Charges" },
  { key: "itempremium", label: "Premium", section: "Metal & Making Charges" },
  { key: "broakerage", label: "Making Charges", section: "Metal & Making Charges" },
  { key: "profitpercent", label: "Profit %", section: "Pricing & Margins" },
  { key: "itemsellprice", label: "Sell Price", section: "Pricing & Margins" },
  { key: "itemtagprice", label: "Tag Price", section: "Pricing & Margins" },
  { key: "itemtagpricecode", label: "Tag Price Code", section: "Pricing & Margins" },
  { key: "itemdiscount", label: "Discount %", section: "Pricing & Margins" },
  { key: "modelno", label: "Model #", section: "Inventory & Settings" },
  { key: "manufacturer", label: "Manufacturer", section: "Inventory & Settings" },
  { key: "itemlocation", label: "Item Location", section: "Inventory & Settings" },
  { key: "itemlength", label: "Length", section: "Inventory & Settings" },
  { key: "itemsize", label: "Width", section: "Inventory & Settings" },
  { key: "itemcolor", label: "Color", section: "Inventory & Settings" },
  { key: "itemweighttext", label: "Weight", section: "Inventory & Settings" },
  { key: "itemreorderqtypnt", label: "Reorder Point", section: "Inventory & Settings" },
  { key: "itemreorderqty", label: "Reorder Quantity", section: "Inventory & Settings" },
  { key: "itemtaxable", label: "Taxable", section: "Inventory & Settings" },
  { key: "trackinventory", label: "Track Inventory", section: "Inventory & Settings" },
  { key: "itemalertwarning", label: "Alert Warning", section: "Inventory & Settings" },
  { key: "itemremarks", label: "Remarks", section: "Notes & Description" },
  { key: "detaileditemdescription", label: "Detailed Description", section: "Notes & Description" },
];

export const PRODUCT_STONE_DETAILS_BULK_TOGGLE = {
  key: STONE_DETAILS_SECTION_KEY,
  label: "Hide Stone Details section",
  description:
    "Removes the entire diamond-grading tab (lab cert, carat, clarity, measurements, stone pricing, etc.) from the product form. For jewelers who don't sell loose/set diamonds.",
};
