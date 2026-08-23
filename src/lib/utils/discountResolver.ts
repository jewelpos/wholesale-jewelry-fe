export type DiscountSource = 'item' | 'bulk' | 'promotion' | 'manual';

export interface BulkDiscountTier {
  bulkdiscountid: number;
  itemid: number;
  minquantity: number;
  maxquantity: number | null;
  discountamount: number;
  discounttype: 'PERCENT' | 'FLAT';
  warehouseid?: number | null;
}

export interface PromotionItem {
  promotionitemid: number;
  promotionid: number;
  itemid: number | null;
  categoryid: number | null;
  requiredquantity: number | null;
  discountamount: number;
  discounttype: 'PERCENT' | 'FLAT';
}

export interface ActivePromotion {
  promotionid: number;
  promotionname: string;
  isactive: number;
  startdate: string | null;
  enddate: string | null;
  items: PromotionItem[];
}

export interface ResolvedDiscount {
  discountpercent: number;
  discountsource: DiscountSource | null;
  discountpromotionid: number | null;
  label: string;
}

function toPercent(discountamount: number, discounttype: 'PERCENT' | 'FLAT', unitprice: number): number {
  // discountamount can arrive as a string (numeric DB columns serialize that
  // way without an explicit transformer) — Number() here guarantees callers
  // always get a real number back, since e.g. `"15".toFixed` doesn't exist.
  const amt = Number(discountamount) || 0;
  if (discounttype === 'FLAT') {
    return unitprice > 0 ? (amt / unitprice) * 100 : 0;
  }
  return amt;
}

export function resolveDiscount(params: {
  itemDiscount: number;
  unitprice: number;
  qty: number;
  bulkTiers: BulkDiscountTier[];
  activePromotions: ActivePromotion[];
  itemid: number;
  categoryid?: number | null;
  warehouseid?: number | null;
  today?: string;
}): ResolvedDiscount {
  const { itemDiscount, unitprice, qty, bulkTiers, activePromotions, itemid, categoryid, warehouseid } = params;
  const todayStr = params.today ?? new Date().toISOString().slice(0, 10);

  let best: ResolvedDiscount = { discountpercent: 0, discountsource: null, discountpromotionid: null, label: '—' };

  // Item-level discount
  if (itemDiscount > 0) {
    best = { discountpercent: itemDiscount, discountsource: 'item', discountpromotionid: null, label: `Item ${itemDiscount}%` };
  }

  // Bulk discount
  const matchingTier = bulkTiers.find(t => {
    if (warehouseid && t.warehouseid && t.warehouseid !== warehouseid) return false;
    const minOk = qty >= Number(t.minquantity);
    const maxOk = t.maxquantity == null || qty <= Number(t.maxquantity);
    return minOk && maxOk;
  });
  if (matchingTier) {
    const bulkPct = toPercent(matchingTier.discountamount, matchingTier.discounttype, unitprice);
    if (bulkPct > best.discountpercent) {
      best = { discountpercent: bulkPct, discountsource: 'bulk', discountpromotionid: null, label: `Bulk ${bulkPct.toFixed(2)}%` };
    }
  }

  // Promotional discount
  for (const promo of activePromotions) {
    if (!promo.isactive) continue;
    if (promo.startdate && todayStr < promo.startdate) continue;
    if (promo.enddate && todayStr > promo.enddate) continue;

    for (const pi of promo.items) {
      // pi.itemid comes back from the backend as a string (bigint column,
      // explicitly String()'d in the resolver) while itemid here is always a
      // number — `===` between those never matches, so item-specific promos
      // silently never applied regardless of quantity. Compare as numbers.
      const itemMatch = pi.itemid != null && Number(pi.itemid) === Number(itemid);
      const catMatch = pi.categoryid != null && Number(pi.categoryid) === Number(categoryid);
      if (!itemMatch && !catMatch) continue;
      if (pi.requiredquantity != null && qty < Number(pi.requiredquantity)) continue;

      const promoPct = toPercent(pi.discountamount, pi.discounttype, unitprice);
      if (promoPct > best.discountpercent) {
        best = {
          discountpercent: promoPct,
          discountsource: 'promotion',
          discountpromotionid: promo.promotionid,
          label: `Promo: ${promo.promotionname} ${promoPct.toFixed(2)}%`,
        };
      }
    }
  }

  return best;
}
