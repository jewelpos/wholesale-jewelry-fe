export type PromotionType = "standard";

export type PromotionItem = {
  promotionitemid?: number;
  promotionid?: number;
  itemid?: string | null;
  categoryid?: number | null;
  pricerangemin?: number | null;
  pricerangemax?: number | null;
  requiredquantity?: number | null;
  discountamount?: number | null;
  discounttype: string;
  itemname?: string | null;
  categoryname?: string | null;
};

export type InventoryPromotion = {
  promotionid: number;
  promotionname: string;
  promotiontype: PromotionType;
  startdate: string;
  enddate: string;
  isactive: number;
  description?: string | null;
  warehouseid?: number | null;
  items?: PromotionItem[];
};

export type BulkDiscountTierRow = {
  bulkdiscountid?: number;
  minquantity: number | string;
  maxquantity: number | string;
  discountamount: number | string;
  discounttype: string;
  warehouseid?: number | null;
};
