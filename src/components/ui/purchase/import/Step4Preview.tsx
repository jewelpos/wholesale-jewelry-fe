'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { cleanCell, cleanNumeric, DEFAULT_UNITS, RawSheet } from '@/lib/utils/poImportParser';
import { ColumnMapping } from './Step3ColumnMap';
import { GET_INVENTORY_ITEMS_BY_ITEMCODES } from '@/lib/graphql/query/poImport';
import { GET_ITEM_CATEGORIES_QUERY, GET_ITEM_SUBCATEGORIES_QUERY } from '@/lib/graphql/query/products';
import { GET_METAL_TYPE_LIST_QUERY } from '@/lib/graphql/query/metalType';

export interface ImportedPOItem {
  itemid?: number;
  itemcode: string;
  itemdescription: string;
  itemunit: string;
  qtyordered: number;
  orderunitcost: number;
  orddiscount: number;
  itemimagepath?: string;
  itemsaleprice?: number;
  itemtagprice?: number;
}

type DupAction = 'merge' | 'keepall' | 'removeextras';

interface MappedRow {
  rowNum: number;
  itemcode: string;
  itemdescription: string;
  itemunit: string;
  categoryid: number | null;
  subcategoryid: number | null;
  itemmetal: string | null;
  qtyordered: number | null;
  orderunitcost: number | null;
  orddiscount: number | null;
  imageurl: string;
  itemlength: string;
  itemsize: string;
  itemcolor: string;
  itemweight: string;
  itemsaleprice: number | null;
  itemtagprice: number | null;
  hasHardError: boolean;
  missingDescOnly: boolean;
  itemid?: number;
  isNew?: boolean;
}

interface RowOverride {
  itemunit?: string;
  categoryid?: number | null;
  subcategoryid?: number | null;
  itemmetal?: string | null;
}

interface Props {
  storeId: number;
  userId: number;
  warehouseId?: number;
  supplierId?: number;
  fileName: string;
  sheet: RawSheet;
  startRow: number;
  mapping: ColumnMapping;
  onBack: () => void;
  onDone: (items: ImportedPOItem[]) => void;
  onImportStart?: () => void;
  onImportError?: () => void;
}

interface CategoryItem { categoryid: number; categoryname: string; }
interface SubcategoryItem { subcategoryid: number; subcategoryname: string; }

function getColIndex(letter: string): number {
  if (!letter) return -1;
  let n = 0;
  for (const ch of letter.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1;
}

function getCell(row: string[], letter: string): string {
  const idx = getColIndex(letter);
  return idx >= 0 ? (row[idx] ?? '') : '';
}

export default function Step4Preview({
  storeId,
  userId,
  warehouseId,
  supplierId,
  fileName,
  sheet,
  startRow,
  mapping,
  onBack,
  onDone,
  onImportStart,
  onImportError,
}: Props) {
  const [dupActions, setDupActions] = useState<Record<string, DupAction>>({});
  const [includedNoDesc, setIncludedNoDesc] = useState<Set<number>>(new Set());
  const [batchResult, setBatchResult] = useState<{
    created: { itemcode: string; itemid: number }[];
    failed: { itemcode: string; reason: string }[];
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [partialError, setPartialError] = useState(false);
  const [itemIdMap, setItemIdMap] = useState<Record<string, number>>({});

  // Per-row overrides for unit / category / subcategory
  const [rowOverrides, setRowOverrides] = useState<Record<number, RowOverride>>({});

  // Bulk-apply values
  const [bulkUnit, setBulkUnit] = useState(mapping.defaultUnit || 'Pc');
  const [bulkCategoryId, setBulkCategoryId] = useState<number | null>(mapping.categoryid ?? null);
  const [bulkSubcategoryId, setBulkSubcategoryId] = useState<number | null>(mapping.subcategoryid ?? null);
  const [bulkMetalName, setBulkMetalName] = useState<string | null>(mapping.itemmetal ?? null);

  const [fetchItems, { loading: loadingItems }] = useLazyQuery(GET_INVENTORY_ITEMS_BY_ITEMCODES, {
    fetchPolicy: 'network-only',
  });

  const { data: categoriesData } = useQuery(GET_ITEM_CATEGORIES_QUERY, {
    variables: { storeid: storeId },
    fetchPolicy: 'cache-first',
  });
  const categories: CategoryItem[] = categoriesData?.getItemCategories ?? [];

  const { data: metalTypeData } = useQuery(GET_METAL_TYPE_LIST_QUERY, {
    variables: { storeid: storeId },
    fetchPolicy: 'cache-first',
  });
  const metalTypes: { metaltypeid: number; metalname: string }[] = metalTypeData?.getMetalTypeList ?? [];

  // Subcategory is independent of category — one flat list for the whole store, not
  // scoped/cached per categoryid. Each selector still stays gated behind picking a
  // category first (see render below); this just controls what fills it once it opens.
  const { data: subcategoriesData } = useQuery(GET_ITEM_SUBCATEGORIES_QUERY, {
    variables: { storeid: storeId },
    fetchPolicy: 'cache-first',
  });
  const allSubcategories: SubcategoryItem[] = subcategoriesData?.getItemSubcategories ?? [];

  // Build raw mapped rows from the sheet
  const rawRows: MappedRow[] = useMemo(() => {
    const dataRows = sheet.rows.slice(startRow);
    const result: MappedRow[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      // Item codes never contain whitespace — strip it here (not just cleanCell's
      // trim) so the preview shows the same code that will actually get saved.
      const itemcode = cleanCell(getCell(row, mapping.itemcode)).replace(/\s+/g, '');
      const itemdescription = cleanCell(getCell(row, mapping.itemdescription));
      const qtyordered = cleanNumeric(getCell(row, mapping.qtyordered));
      const orderunitcost = cleanNumeric(getCell(row, mapping.orderunitcost));
      const itemunit = mapping.defaultUnit || 'Pc';
      const orddiscount = mapping.orddiscount ? cleanNumeric(getCell(row, mapping.orddiscount)) : null;
      const imageurl = mapping.imageurl ? cleanCell(getCell(row, mapping.imageurl)) : '';
      const itemlength = mapping.itemlength ? cleanCell(getCell(row, mapping.itemlength)) : '';
      const itemsize = mapping.itemsize ? cleanCell(getCell(row, mapping.itemsize)) : '';
      const itemcolor = mapping.itemcolor ? cleanCell(getCell(row, mapping.itemcolor)) : '';
      const itemweight = mapping.itemweight ? cleanCell(getCell(row, mapping.itemweight)) : '';
      const itemsaleprice = mapping.itemsaleprice ? cleanNumeric(getCell(row, mapping.itemsaleprice)) : null;
      const itemtagprice = mapping.itemtagprice ? cleanNumeric(getCell(row, mapping.itemtagprice)) : null;

      if (!itemcode && !itemdescription && qtyordered === null && orderunitcost === null) continue;

      const hasHardError = qtyordered === null || orderunitcost === null;
      const missingDescOnly = !hasHardError && !itemdescription;

      result.push({
        rowNum: startRow + i,
        itemcode,
        itemdescription,
        itemunit,
        categoryid: mapping.categoryid ?? null,
        subcategoryid: mapping.subcategoryid ?? null,
        itemmetal: mapping.itemmetal ?? null,
        qtyordered,
        orderunitcost,
        orddiscount,
        imageurl,
        itemlength,
        itemsize,
        itemcolor,
        itemweight,
        itemsaleprice,
        itemtagprice,
        hasHardError,
        missingDescOnly,
      });
    }
    return result;
  }, [sheet, startRow, mapping]);

  // Resolve item IDs from DB
  useEffect(() => {
    const codes = [...new Set(rawRows.filter((r) => r.itemcode).map((r) => r.itemcode))];
    if (!codes.length) return;
    fetchItems({ variables: { storeid: storeId, itemcodes: codes } }).then(({ data }) => {
      const map: Record<string, number> = {};
      for (const item of data?.getInventoryItemsByItemCodes ?? []) {
        map[item.itemcode] = item.itemid;
      }
      setItemIdMap(map);
    });
  }, [rawRows, storeId, fetchItems]);

  // Tag rows with itemid / isNew
  const taggedRows: MappedRow[] = useMemo(() => {
    return rawRows.map((r) => ({
      ...r,
      itemid: itemIdMap[r.itemcode],
      isNew: r.itemcode ? !(r.itemcode in itemIdMap) : false,
    }));
  }, [rawRows, itemIdMap]);

  // Merge per-row overrides
  const effectiveRow = (r: MappedRow): MappedRow => {
    const ov = rowOverrides[r.rowNum];
    if (!ov) return r;
    return { ...r, ...ov };
  };

  const effectiveRows = useMemo(() => taggedRows.map(effectiveRow), [taggedRows, rowOverrides]);

  const validRows = effectiveRows.filter((r) => !r.hasHardError && !r.missingDescOnly);
  const noDescRows = effectiveRows.filter((r) => r.missingDescOnly);
  const hardErrorRows = effectiveRows.filter((r) => r.hasHardError);

  const eligibleRows = useMemo(
    () => [...validRows, ...noDescRows.filter((r) => includedNoDesc.has(r.rowNum))],
    [validRows, noDescRows, includedNoDesc],
  );

  const dupGroups: Record<string, MappedRow[]> = useMemo(() => {
    const groups: Record<string, MappedRow[]> = {};
    for (const r of eligibleRows) {
      if (!r.itemcode) continue;
      if (!groups[r.itemcode]) groups[r.itemcode] = [];
      groups[r.itemcode].push(r);
    }
    return Object.fromEntries(Object.entries(groups).filter(([, rows]) => rows.length > 1));
  }, [eligibleRows]);

  const hasPendingDups = Object.keys(dupGroups).some((code) => !dupActions[code]);

  function toggleNoDescRow(rowNum: number) {
    setIncludedNoDesc((prev) => {
      const next = new Set(prev);
      if (next.has(rowNum)) next.delete(rowNum);
      else next.add(rowNum);
      return next;
    });
  }

  function toggleAllNoDesc(include: boolean) {
    setIncludedNoDesc(include ? new Set(noDescRows.map((r) => r.rowNum)) : new Set());
  }

  function updateRowOverride(rowNum: number, patch: Partial<RowOverride>) {
    setRowOverrides((prev) => ({
      ...prev,
      [rowNum]: { ...(prev[rowNum] ?? {}), ...patch },
    }));
  }

  function applyToAll() {
    const patch: RowOverride = {
      itemunit: bulkUnit,
      categoryid: bulkCategoryId,
      subcategoryid: bulkSubcategoryId,
      itemmetal: bulkMetalName,
    };
    setRowOverrides((prev) => {
      const next = { ...prev };
      taggedRows.forEach((r) => {
        next[r.rowNum] = { ...(next[r.rowNum] ?? {}), ...patch };
      });
      return next;
    });
  }

  // Resolve final rows after dup actions
  function resolveFinal(): MappedRow[] {
    const rows = eligibleRows.map((r) =>
      r.missingDescOnly ? { ...r, itemdescription: r.itemcode || 'No description' } : r,
    );

    const final: MappedRow[] = [];
    const seen: Record<string, boolean> = {};

    for (const r of rows) {
      const code = r.itemcode;
      const isDup = code in dupGroups;
      if (!isDup) {
        final.push(r);
        continue;
      }
      const action: DupAction = dupActions[code] ?? 'merge';
      if (action === 'keepall') {
        final.push(r);
      } else if (action === 'removeextras') {
        if (!seen[code]) { final.push(r); seen[code] = true; }
      } else {
        seen[code] = true;
      }
    }
    for (const [code, dupRows] of Object.entries(dupGroups)) {
      const action: DupAction = dupActions[code] ?? 'merge';
      if (action === 'merge') {
        const totalQty = dupRows.reduce((s, r) => s + (r.qtyordered ?? 0), 0);
        const avgCost = dupRows.reduce((s, r) => s + (r.orderunitcost ?? 0), 0) / dupRows.length;
        const base = dupRows[0];
        final.push({
          ...base,
          itemdescription: base.itemdescription || base.itemcode || 'No description',
          qtyordered: totalQty,
          orderunitcost: avgCost,
        });
      }
    }
    return final;
  }

  async function handleImport(overrideRows?: MappedRow[]) {
    const finalRows = overrideRows ?? resolveFinal();
    const newRows = finalRows.filter((r) => r.isNew && r.itemcode);
    // Existing items aren't otherwise touched by import — only sent through if this
    // sheet actually mapped length/width/color/weight, so the backend has something to update.
    const existingRowsWithLwc = finalRows.filter(
      (r) => !r.isNew && r.itemcode && (r.itemlength || r.itemsize || r.itemcolor || r.itemweight),
    );
    const rowsToSend = [...newRows, ...existingRowsWithLwc];

    onImportStart?.();
    setImporting(true);
    setPartialError(false);
    setBatchResult(null);

    let createdMap: Record<string, number> = {};

    if (rowsToSend.length > 0) {
      try {
        const payload = {
          storeid: storeId,
          warehouseid: warehouseId,
          supplierid: supplierId || undefined,
          items: rowsToSend.map((r) => ({
            itemcode: r.itemcode,
            itemdescription: r.itemdescription || r.itemcode,
            itemunit: r.itemunit,
            itemimagepath: r.imageurl?.startsWith('http') ? r.imageurl : undefined,
            itempurchaseprice: r.orderunitcost ?? 0,
            itemsellprice: r.itemsaleprice ?? undefined,
            itemtagprice: r.itemtagprice ?? undefined,
            categoryid: r.categoryid ?? undefined,
            subcategoryid: r.subcategoryid ?? undefined,
            itemmetal: r.itemmetal ?? undefined,
            itemlength: r.itemlength || undefined,
            itemsize: r.itemsize || undefined,
            itemcolor: r.itemcolor || undefined,
            itemweight: r.itemweight || undefined,
          })),
        };

        const res = await fetch(
          `/api/proxy/batch-add`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}: ${await res.text()}`);
        }
        const json = await res.json();

        setBatchResult(json);
        for (const c of json.created ?? []) {
          createdMap[c.itemcode] = c.itemid;
        }

        if ((json.failed ?? []).length > 0) {
          setPartialError(true);
          setImporting(false);
          onImportError?.();
          return;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setBatchResult({ created: [], failed: [{ itemcode: 'batch', reason: msg }] });
        setPartialError(true);
        setImporting(false);
        onImportError?.();
        return;
      }
    }

    finalize(finalRows, createdMap);
  }

  function finalize(finalRows: MappedRow[], createdMap: Record<string, number>) {
    const items: ImportedPOItem[] = finalRows.map((r) => ({
      itemid: r.itemid ?? createdMap[r.itemcode],
      itemcode: r.itemcode,
      itemdescription: r.itemdescription || r.itemcode || 'No description',
      itemunit: r.itemunit,
      qtyordered: r.qtyordered ?? 1,
      orderunitcost: r.orderunitcost ?? 0,
      orddiscount: r.orddiscount ?? 0,
      itemimagepath: r.imageurl?.startsWith('http') ? r.imageurl : undefined,
      itemsaleprice: r.itemsaleprice ?? undefined,
      itemtagprice: r.itemtagprice ?? undefined,
    }));

    setImporting(false);
    onDone(items);
  }

  const totalImport = eligibleRows.length;
  const newCount = validRows.filter((r) => r.isNew).length + noDescRows.filter((r) => includedNoDesc.has(r.rowNum) && r.isNew).length;
  const existCount = validRows.filter((r) => !r.isNew).length + noDescRows.filter((r) => includedNoDesc.has(r.rowNum) && !r.isNew).length;
  const totalRows = rawRows.length;
  const uniqueCodeCount = new Set(eligibleRows.filter((r) => r.itemcode).map((r) => r.itemcode)).size;
  const dupRowCount = Object.values(dupGroups).reduce((s, rows) => s + rows.length, 0);

  // Helper: category name lookup
  const catName = (id: number | null) => categories.find((c) => c.categoryid === id)?.categoryname ?? '—';
  const subCatName = (catId: number | null, subId: number | null) => {
    if (!catId || !subId) return '—';
    return allSubcategories.find((s) => s.subcategoryid === subId)?.subcategoryname ?? '—';
  };

  return (
    <div>
      <h6 className="fw-semibold mb-2">Step 4 — Preview & Import</h6>

      {loadingItems && (
        <div className="text-muted small mb-2">
          <div className="spinner-border spinner-border-sm me-1" /> Resolving items…
        </div>
      )}

      {/* Summary stats */}
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
        <span className="badge bg-secondary">Total: {totalRows}</span>
        <span className="badge bg-info text-dark">Unique: {uniqueCodeCount}</span>
        <span className="badge bg-primary">New: {newCount} 🆕</span>
        <span className="badge bg-success">Existing: {existCount} ✅</span>
        {dupRowCount > 0 && (
          <span className="badge bg-warning text-dark">
            Duplicates: {dupRowCount} row{dupRowCount > 1 ? 's' : ''} ({Object.keys(dupGroups).length} SKU{Object.keys(dupGroups).length > 1 ? 's' : ''}) ⚠
          </span>
        )}
        {noDescRows.length > 0 && (
          <span className="badge bg-warning text-dark">
            {noDescRows.length - includedNoDesc.size} no-description ⚠
          </span>
        )}
        {hardErrorRows.length > 0 && (
          <span className="badge bg-danger">Skipped: {hardErrorRows.length} ⚠</span>
        )}
      </div>

      {/* Apply-to-All toolbar */}
      <div className="border rounded p-2 mb-3 bg-light d-flex flex-wrap gap-2 align-items-center">
        <span className="small fw-semibold text-secondary me-1">Apply to all rows:</span>
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={bulkUnit}
          onChange={(e) => setBulkUnit(e.target.value)}
        >
          {DEFAULT_UNITS.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
        <select
          className="form-select form-select-sm"
          style={{ width: 160 }}
          value={bulkCategoryId ?? ''}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : null;
            setBulkCategoryId(v);
            setBulkSubcategoryId(null);
          }}
        >
          <option value="">— Category —</option>
          {categories.map((c) => (
            <option key={c.categoryid} value={c.categoryid}>{c.categoryname}</option>
          ))}
        </select>
        {bulkCategoryId && (
          <select
            className="form-select form-select-sm"
            style={{ width: 160 }}
            value={bulkSubcategoryId ?? ''}
            onChange={(e) => setBulkSubcategoryId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— Sub-Category —</option>
            {allSubcategories.map((s) => (
              <option key={s.subcategoryid} value={s.subcategoryid}>{s.subcategoryname}</option>
            ))}
          </select>
        )}
        <select
          className="form-select form-select-sm"
          style={{ width: 160 }}
          value={bulkMetalName ?? ''}
          onChange={(e) => setBulkMetalName(e.target.value || null)}
        >
          <option value="">— Metal —</option>
          {metalTypes.map((m) => (
            <option key={m.metaltypeid} value={m.metalname}>{m.metalname}</option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={applyToAll}
        >
          Apply to All Rows
        </button>
      </div>

      {/* Missing-description rows — opt-in panel */}
      {noDescRows.length > 0 && (
        <div className="alert alert-warning py-2 mb-3" style={{ fontSize: 12 }}>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <strong>{noDescRows.length} row(s) have no description — select which to include:</strong>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-xs btn-outline-secondary py-0 px-1" style={{ fontSize: 11 }}
                onClick={() => toggleAllNoDesc(true)}>Select All</button>
              <button type="button" className="btn btn-xs btn-outline-secondary py-0 px-1" style={{ fontSize: 11 }}
                onClick={() => toggleAllNoDesc(false)}>Clear All</button>
            </div>
          </div>
          <p className="mb-1 text-muted" style={{ fontSize: 11 }}>
            Item code will be used as description for included rows.
          </p>
          <div style={{ maxHeight: 130, overflowY: 'auto' }}>
            {noDescRows.map((r) => (
              <div key={r.rowNum} className="form-check mb-0">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id={`nodesc-${r.rowNum}`}
                  checked={includedNoDesc.has(r.rowNum)}
                  onChange={() => toggleNoDescRow(r.rowNum)}
                />
                <label className="form-check-label" htmlFor={`nodesc-${r.rowNum}`} style={{ fontSize: 11 }}>
                  Row {r.rowNum} — <strong>{r.itemcode || '(no code)'}</strong>
                  {' · '}Qty: {r.qtyordered} · Cost: {r.orderunitcost}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate SKU action selectors */}
      {Object.keys(dupGroups).length > 0 && (
        <div className="alert alert-warning py-2 mb-3">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <strong>Duplicate SKUs — choose action per group:</strong>
            <div className="d-flex gap-1">
              <span className="small text-muted me-1">Apply to all:</span>
              {(['merge', 'keepall', 'removeextras'] as DupAction[]).map((a) => (
                <button key={a} type="button" className="btn btn-xs btn-outline-secondary py-0 px-2" style={{ fontSize: 11 }}
                  onClick={() => {
                    const all: Record<string, DupAction> = {};
                    Object.keys(dupGroups).forEach((c) => { all[c] = a; });
                    setDupActions(all);
                  }}>
                  {a === 'merge' ? 'Sum Qty' : a === 'keepall' ? 'Keep All' : 'Remove Extras'}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1">
            {Object.entries(dupGroups).map(([code, rows]) => (
              <div key={code} className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <span className="small fw-semibold">{code}</span>
                <span className="small text-muted">({rows.length} rows)</span>
                {(['merge', 'keepall', 'removeextras'] as DupAction[]).map((a) => (
                  <div key={a} className="form-check form-check-inline mb-0">
                    <input
                      type="radio"
                      className="form-check-input"
                      id={`dup-${code}-${a}`}
                      checked={(dupActions[code] ?? 'merge') === a}
                      onChange={() => setDupActions((prev) => ({ ...prev, [code]: a }))}
                    />
                    <label className="form-check-label small" htmlFor={`dup-${code}-${a}`}>
                      {a === 'merge' ? 'Merge (sum qty)' : a === 'keepall' ? 'Keep All' : 'Remove Extras'}
                    </label>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partial failure panel */}
      {partialError && batchResult && (
        <div className="alert alert-danger py-2 mb-3">
          <strong>Item creation had errors:</strong>
          <ul className="mb-2 mt-1 small">
            {batchResult.created.length > 0 && (
              <li className="text-success">✅ {batchResult.created.length} created successfully</li>
            )}
            {batchResult.failed.map((f) => (
              <li key={f.itemcode}>❌ {f.itemcode}: {f.reason}</li>
            ))}
          </ul>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-warning"
              onClick={() => {
                const createdMap: Record<string, number> = {};
                for (const c of batchResult.created) createdMap[c.itemcode] = c.itemid;
                const finalRows = resolveFinal().filter((r) => !r.isNew || r.itemcode in createdMap);
                finalize(finalRows, createdMap);
              }}
            >
              Import {batchResult.created.length} successful rows anyway
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary"
              onClick={() => { setPartialError(false); setBatchResult(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preview table */}
      <div style={{ overflowX: 'auto', maxHeight: 340, overflowY: 'auto', fontSize: 12 }}>
        <table className="table table-sm table-bordered mb-0">
          <thead className="table-light sticky-top">
            <tr>
              <th>#</th>
              <th>Status</th>
              <th>Item Code</th>
              <th>Description</th>
              <th style={{ minWidth: 80 }}>Unit</th>
              <th style={{ minWidth: 150 }}>Category</th>
              <th style={{ minWidth: 150 }}>Sub-Category</th>
              <th style={{ minWidth: 130 }}>Metal</th>
              <th style={{ minWidth: 80 }}>Length</th>
              <th style={{ minWidth: 80 }}>Width</th>
              <th style={{ minWidth: 80 }}>Color</th>
              <th className="text-end" style={{ minWidth: 80 }}>Weight</th>
              <th className="text-end">Qty</th>
              <th className="text-end">Unit Cost</th>
              <th className="text-end">Disc %</th>
              <th className="text-end">Sale Price</th>
              <th className="text-end">Tag Price</th>
            </tr>
          </thead>
          <tbody>
            {effectiveRows.map((r, i) => {
              const isOptedIn = includedNoDesc.has(r.rowNum);
              let rowClass = '';
              if (r.hasHardError) rowClass = 'table-warning';
              else if (r.missingDescOnly && !isOptedIn) rowClass = 'table-warning';

              const subcats = r.categoryid ? allSubcategories : [];

              return (
                <tr key={i} className={rowClass}>
                  <td className="text-muted">{r.rowNum}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {r.hasHardError && <span title="Missing qty or cost — excluded">⚠</span>}
                    {r.missingDescOnly && (
                      <input
                        type="checkbox"
                        className="form-check-input mt-0 me-1"
                        checked={isOptedIn}
                        onChange={() => toggleNoDescRow(r.rowNum)}
                        title="Include this row (item code will be used as description)"
                      />
                    )}
                    {!r.hasHardError && !r.missingDescOnly && (r.isNew ? '🆕' : '✅')}
                    {r.missingDescOnly && isOptedIn && (r.isNew ? '🆕' : '✅')}
                    {r.itemcode in dupGroups && (
                      <span className="badge bg-warning text-dark ms-1" style={{ fontSize: 10 }}>DUP</span>
                    )}
                  </td>
                  <td>{r.itemcode || <span className="text-muted">—</span>}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.itemdescription
                      ? r.itemdescription
                      : r.missingDescOnly
                        ? <span className="text-muted fst-italic">{isOptedIn ? `(using: ${r.itemcode})` : '—'}</span>
                        : <span className="text-muted">—</span>}
                  </td>

                  {/* Unit per row */}
                  <td>
                    <select
                      className="form-select form-select-sm py-0"
                      style={{ fontSize: 11, minWidth: 70 }}
                      value={r.itemunit}
                      onChange={(e) => updateRowOverride(r.rowNum, { itemunit: e.target.value })}
                    >
                      {DEFAULT_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>{u.value}</option>
                      ))}
                    </select>
                  </td>

                  {/* Category per row */}
                  <td>
                    <select
                      className="form-select form-select-sm py-0"
                      style={{ fontSize: 11, minWidth: 130 }}
                      value={r.categoryid ?? ''}
                      onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : null;
                        updateRowOverride(r.rowNum, { categoryid: v, subcategoryid: null });
                      }}
                    >
                      <option value="">— None —</option>
                      {categories.map((c) => (
                        <option key={c.categoryid} value={c.categoryid}>{c.categoryname}</option>
                      ))}
                    </select>
                  </td>

                  {/* Sub-Category per row */}
                  <td>
                    {r.categoryid ? (
                      <select
                        className="form-select form-select-sm py-0"
                        style={{ fontSize: 11, minWidth: 130 }}
                        value={r.subcategoryid ?? ''}
                        onChange={(e) => updateRowOverride(r.rowNum, { subcategoryid: e.target.value ? Number(e.target.value) : null })}
                      >
                        <option value="">— None —</option>
                        {subcats.map((s) => (
                          <option key={s.subcategoryid} value={s.subcategoryid}>{s.subcategoryname}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted" style={{ fontSize: 11 }}>—</span>
                    )}
                  </td>

                  {/* Metal per row */}
                  <td>
                    <select
                      className="form-select form-select-sm py-0"
                      style={{ fontSize: 11, minWidth: 110 }}
                      value={r.itemmetal ?? ''}
                      onChange={(e) => updateRowOverride(r.rowNum, { itemmetal: e.target.value || null })}
                    >
                      <option value="">— None —</option>
                      {metalTypes.map((m) => (
                        <option key={m.metaltypeid} value={m.metalname}>{m.metalname}</option>
                      ))}
                    </select>
                  </td>

                  <td>{r.itemlength || <span className="text-muted">—</span>}</td>
                  <td>{r.itemsize || <span className="text-muted">—</span>}</td>
                  <td>{r.itemcolor || <span className="text-muted">—</span>}</td>
                  <td className="text-end">{r.itemweight || <span className="text-muted">—</span>}</td>
                  <td className="text-end">{r.qtyordered ?? <span className="text-danger">!</span>}</td>
                  <td className="text-end">{r.orderunitcost ?? <span className="text-danger">!</span>}</td>
                  <td className="text-end">{r.orddiscount ?? 0}</td>
                  <td className="text-end">{r.itemsaleprice ?? <span className="text-muted">—</span>}</td>
                  <td className="text-end">{r.itemtagprice ?? <span className="text-muted">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="d-flex gap-2 mt-3 align-items-center flex-wrap">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onBack} disabled={importing}>
          ← Back
        </button>
        <button
          type="button"
          className="btn btn-sm btn-success"
          disabled={importing || hasPendingDups || totalImport === 0 || loadingItems}
          onClick={() => handleImport()}
        >
          {importing ? (
            <><div className="spinner-border spinner-border-sm me-2" />Importing…</>
          ) : (
            `Import ${totalImport} Items into PO`
          )}
        </button>
        {hasPendingDups && (
          <span className="small text-danger">Resolve all duplicate groups first.</span>
        )}
      </div>
    </div>
  );
}
