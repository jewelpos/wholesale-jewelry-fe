'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { cleanCell, cleanNumeric, RawSheet } from '@/lib/utils/poImportParser';
import { ColumnMapping } from './Step3ColumnMap';
import { GET_INVENTORY_ITEMS_BY_ITEMCODES } from '@/lib/graphql/query/poImport';
import { getAccessToken } from '@/lib/authStorage';

export interface ImportedPOItem {
  itemid?: number;
  itemcode: string;
  itemdescription: string;
  itemunit: string;
  qtyordered: number;
  orderunitcost: number;
  orddiscount: number;
  itemimagepath?: string;
}

type DupAction = 'merge' | 'keepall' | 'removeextras';

interface MappedRow {
  rowNum: number;
  itemcode: string;
  itemdescription: string;
  itemunit: string;
  qtyordered: number | null;
  orderunitcost: number | null;
  orddiscount: number | null;
  imageurl: string;
  // hard error — missing qty or cost; always excluded
  hasHardError: boolean;
  // soft warning — description missing but qty+cost are present; user can opt-in
  missingDescOnly: boolean;
  itemid?: number;
  isNew?: boolean;
}

interface Props {
  storeId: number;
  userId: number;
  fileName: string;
  sheet: RawSheet;
  startRow: number;
  mapping: ColumnMapping;
  onBack: () => void;
  onDone: (items: ImportedPOItem[]) => void;
}

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
  fileName,
  sheet,
  startRow,
  mapping,
  onBack,
  onDone,
}: Props) {
  const [dupActions, setDupActions] = useState<Record<string, DupAction>>({});
  // Set of rowNums the user has opted to include despite missing description
  const [includedNoDesc, setIncludedNoDesc] = useState<Set<number>>(new Set());
  const [batchResult, setBatchResult] = useState<{
    created: { itemcode: string; itemid: number }[];
    failed: { itemcode: string; reason: string }[];
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [partialError, setPartialError] = useState(false);
  const [itemIdMap, setItemIdMap] = useState<Record<string, number>>({});

  const [fetchItems, { loading: loadingItems }] = useLazyQuery(GET_INVENTORY_ITEMS_BY_ITEMCODES, {
    fetchPolicy: 'network-only',
  });

  // Build raw mapped rows from the sheet
  const rawRows: MappedRow[] = useMemo(() => {
    const dataRows = sheet.rows.slice(startRow);
    const result: MappedRow[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const itemcode = cleanCell(getCell(row, mapping.itemcode));
      const itemdescription = cleanCell(getCell(row, mapping.itemdescription));
      const qtyordered = cleanNumeric(getCell(row, mapping.qtyordered));
      const orderunitcost = cleanNumeric(getCell(row, mapping.orderunitcost));
      const rawUnit = mapping.itemunit ? cleanCell(getCell(row, mapping.itemunit)) : '';
      const itemunit = rawUnit || mapping.defaultUnit || 'Pc';
      const orddiscount = mapping.orddiscount ? cleanNumeric(getCell(row, mapping.orddiscount)) : null;
      const imageurl = mapping.imageurl ? cleanCell(getCell(row, mapping.imageurl)) : '';

      // Skip entirely empty rows
      if (!itemcode && !itemdescription && qtyordered === null && orderunitcost === null) continue;

      const hasHardError = qtyordered === null || orderunitcost === null;
      const missingDescOnly = !hasHardError && !itemdescription;

      result.push({
        rowNum: startRow + i,
        itemcode,
        itemdescription,
        itemunit,
        qtyordered,
        orderunitcost,
        orddiscount,
        imageurl,
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

  // Rows that are fully valid (no hard error, description present)
  const validRows = taggedRows.filter((r) => !r.hasHardError && !r.missingDescOnly);
  // Rows missing description only — user can opt-in
  const noDescRows = taggedRows.filter((r) => r.missingDescOnly);
  // Rows with hard errors (missing qty/cost) — always excluded
  const hardErrorRows = taggedRows.filter((r) => r.hasHardError);

  // Duplicate SKU groups (across valid + opted-in no-desc rows)
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

  // Resolve final rows after dup actions
  function resolveFinal(): MappedRow[] {
    const rows = eligibleRows.map((r) =>
      r.missingDescOnly
        ? { ...r, itemdescription: r.itemcode || 'No description' } // fallback
        : r,
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
    // Merge groups
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

    setImporting(true);
    setPartialError(false);
    setBatchResult(null);

    let createdMap: Record<string, number> = {};

    if (newRows.length > 0) {
      try {
        const payload = {
          storeid: storeId,
          items: newRows.map((r) => ({
            itemcode: r.itemcode,
            itemdescription: r.itemdescription || r.itemcode,
            itemunit: r.itemunit,
            itemimagepath: r.imageurl?.startsWith('http') ? r.imageurl : undefined,
          })),
        };

        const token = await getAccessToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/store/product/batch-add`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
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
          return;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setBatchResult({ created: [], failed: [{ itemcode: 'batch', reason: msg }] });
        setPartialError(true);
        setImporting(false);
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
    }));

    // Fire-and-forget via raw fetch (NOT Apollo) — bypasses global errorLink so no logout on failure
    void (async () => {
      try {
        const token = await getAccessToken();
        await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            query: `mutation { saveImportFileRecord(storeid: ${storeId}, filename: ${JSON.stringify(fileName)}, importedby: ${userId}, recordcount: ${items.length}) }`,
          }),
        });
      } catch {
        // ignore — history logging is best-effort
      }
    })();

    setImporting(false);
    onDone(items);
  }

  const totalImport = eligibleRows.length;
  const newCount = validRows.filter((r) => r.isNew).length + noDescRows.filter((r) => includedNoDesc.has(r.rowNum) && r.isNew).length;
  const existCount = validRows.filter((r) => !r.isNew).length + noDescRows.filter((r) => includedNoDesc.has(r.rowNum) && !r.isNew).length;

  return (
    <div>
      <h6 className="fw-semibold mb-2">Step 4 — Preview & Import</h6>

      {loadingItems && (
        <div className="text-muted small mb-2">
          <div className="spinner-border spinner-border-sm me-1" /> Resolving items…
        </div>
      )}

      {/* Summary stats */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <span className="badge bg-success">{existCount} existing ✅</span>
        <span className="badge bg-primary">{newCount} new 🆕</span>
        {noDescRows.length > 0 && (
          <span className="badge bg-warning text-dark">
            {noDescRows.length - includedNoDesc.size} no-description (check to include) ⚠
          </span>
        )}
        {hardErrorRows.length > 0 && (
          <span className="badge bg-warning text-dark">{hardErrorRows.length} skipped (missing qty/cost) ⚠</span>
        )}
        {Object.keys(dupGroups).length > 0 && (
          <span className="badge bg-warning text-dark">{Object.keys(dupGroups).length} duplicate SKU group(s)</span>
        )}
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
          <strong>Duplicate SKUs — choose action per group:</strong>
          <div className="mt-2">
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
      <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto', fontSize: 12 }}>
        <table className="table table-sm table-bordered mb-0">
          <thead className="table-light sticky-top">
            <tr>
              <th>#</th>
              <th>Status</th>
              <th>Item Code</th>
              <th>Description</th>
              <th>Unit</th>
              <th className="text-end">Qty</th>
              <th className="text-end">Unit Cost</th>
              <th className="text-end">Disc %</th>
            </tr>
          </thead>
          <tbody>
            {taggedRows.map((r, i) => {
              const isOptedIn = includedNoDesc.has(r.rowNum);
              let rowClass = '';
              if (r.hasHardError) rowClass = 'table-warning';
              else if (r.missingDescOnly && !isOptedIn) rowClass = 'table-warning';
              else if (r.missingDescOnly && isOptedIn) rowClass = '';

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
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.itemdescription
                      ? r.itemdescription
                      : r.missingDescOnly
                        ? <span className="text-muted fst-italic">{isOptedIn ? `(using: ${r.itemcode})` : '—'}</span>
                        : <span className="text-muted">—</span>}
                  </td>
                  <td>{r.itemunit}</td>
                  <td className="text-end">{r.qtyordered ?? <span className="text-danger">!</span>}</td>
                  <td className="text-end">{r.orderunitcost ?? <span className="text-danger">!</span>}</td>
                  <td className="text-end">{r.orddiscount ?? 0}</td>
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
