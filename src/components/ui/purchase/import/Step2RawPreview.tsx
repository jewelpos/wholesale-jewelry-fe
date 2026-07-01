'use client';

import { useState } from 'react';
import { columnLetter } from '@/lib/utils/poImportParser';
import { RawSheet } from '@/lib/utils/poImportParser';

interface Props {
  sheet: RawSheet;
  onNext: (startRow: number) => void;
  onBack: () => void;
}

const PREVIEW_ROWS = 30;

export default function Step2RawPreview({ sheet, onNext, onBack }: Props) {
  const [startRow, setStartRow] = useState(1);

  const visibleRows = sheet.rows.slice(0, PREVIEW_ROWS);
  const colCount = sheet.colCount;
  const startRowIndex = startRow - 1; // 0-based

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 fw-semibold">Step 2 — Raw Preview</h6>
        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0 small fw-semibold">Data starts at row:</label>
          <input
            type="number"
            min={1}
            max={sheet.rows.length}
            value={startRow}
            onChange={(e) => setStartRow(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="form-control form-control-sm"
            style={{ width: 70 }}
          />
        </div>
      </div>

      <p className="small text-muted mb-2">
        Showing first {Math.min(PREVIEW_ROWS, sheet.rows.length)} rows. Columns are labelled A, B, C…
        The highlighted row will be used as the header / data start row for column mapping.
      </p>

      <div style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto', fontSize: 12 }}>
        <table className="table table-bordered table-sm mb-0" style={{ whiteSpace: 'nowrap' }}>
          <thead className="table-light sticky-top">
            <tr>
              <th style={{ width: 40 }}>#</th>
              {Array.from({ length: colCount }, (_, i) => (
                <th key={i}>{columnLetter(i)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, ri) => {
              const isStart = ri === startRowIndex;
              return (
                <tr
                  key={ri}
                  className={isStart ? 'table-primary' : ''}
                  onClick={() => setStartRow(ri + 1)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="text-muted text-center">{ri + 1}</td>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cell || <span className="text-muted">—</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="small text-muted mt-1">Click any row to set it as the data start row.</p>

      <div className="d-flex gap-2 mt-3">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => onNext(startRow)}>
          Next → Column Mapping
        </button>
      </div>
    </div>
  );
}
