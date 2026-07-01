'use client';

import { useRef, useState } from 'react';
import { Clock, Download, Upload, X } from 'lucide-react';
import { useLazyQuery } from '@apollo/client';
import * as ExcelJS from 'exceljs';
import { loadExcelSheets, parseCsvFile, RawSheet } from '@/lib/utils/poImportParser';
import { CHECK_IMPORT_ITEMCODES_ON_RECENT_POS } from '@/lib/graphql/query/poImport';
import ImportHistoryDrawer from './ImportHistoryDrawer';

interface RecentPOMatch {
  itemcode: string;
  ponumber: number;
  podate: string;
}

interface Props {
  storeId: number;
  onNext: (sheet: RawSheet, fileName: string) => void;
}

const MAX_FILE_SIZE_MB = 15;

export default function Step1Upload({ storeId, onNext }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [parsedFile, setParsedFile] = useState<File | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [recentMatches, setRecentMatches] = useState<RecentPOMatch[]>([]);
  const [pendingSheet, setPendingSheet] = useState<RawSheet | null>(null);

  const [checkRecentPOs] = useLazyQuery(CHECK_IMPORT_ITEMCODES_ON_RECENT_POS, {
    fetchPolicy: 'network-only',
  });

  function resetFile() {
    setFileError('');
    setSheets([]);
    setSelectedSheet('');
    setParsedFile(null);
    setPendingSheet(null);
    setRecentMatches([]);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleFile(file: File) {
    resetFile();

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    const isXlsx = file.name.toLowerCase().endsWith('.xlsx');
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    if (!isXlsx && !isCsv) {
      setFileError('Only .xlsx and .csv files are supported.');
      return;
    }

    setFileName(file.name);
    setLoading(true);
    try {
      if (isCsv) {
        const sheet = await parseCsvFile(file);
        await runDuplicateCheck(sheet, file.name, sheet);
      } else {
        const sheetNames = await loadExcelSheets(file);
        setParsedFile(file);
        setSheets([...sheetNames]);
        setSelectedSheet(sheetNames[0] ?? '');
      }
    } catch (err: unknown) {
      setFileError(`Failed to read file: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSheetConfirm() {
    if (!parsedFile || !selectedSheet) return;
    setLoading(true);
    try {
      const { loadSheetData } = await import('@/lib/utils/poImportParser');
      const sheet = await loadSheetData(parsedFile, selectedSheet);
      await runDuplicateCheck(sheet, fileName, sheet);
    } catch (err: unknown) {
      setFileError(`Failed to load sheet: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function runDuplicateCheck(sheet: RawSheet, name: string, sheetData: RawSheet) {
    const itemcodes = sheet.rows.map((r) => r[0]).filter((v) => v && v.length > 0);
    if (itemcodes.length > 0) {
      const { data } = await checkRecentPOs({
        variables: { storeid: storeId, itemcodes, dayslookback: 30 },
      });
      const matches: RecentPOMatch[] = data?.checkImportItemcodesOnRecentPOs ?? [];
      if (matches.length > 0) {
        setRecentMatches(matches);
        setPendingSheet(sheetData);
        return;
      }
    }
    onNext(sheetData, name);
  }

  function downloadTemplate() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('PO Import');
    ws.addRow(['Item Code', 'Description', 'Qty', 'Unit Cost', 'Unit', 'Discount %', 'Image URL']);
    ws.getRow(1).font = { bold: true };
    ws.columns = [
      { width: 15 }, { width: 30 }, { width: 8 }, { width: 12 },
      { width: 8 }, { width: 12 }, { width: 40 },
    ];
    wb.xlsx.writeBuffer().then((buf) => {
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'PO_Import_Template.xlsx';
      a.click();
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const fileLoaded = !!fileName;

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 fw-semibold">Step 1 — Upload File</h6>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={downloadTemplate}>
            <Download size={14} className="me-1" />
            Sample Template
          </button>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowHistory(true)}>
            <Clock size={14} className="me-1" />
            Import History
          </button>
        </div>
      </div>

      {/* Drop zone — hidden once a file is loaded */}
      {!fileLoaded && (
        <div
          className={`border rounded p-4 text-center mb-3 ${dragging ? 'border-primary bg-light' : ''}`}
          style={{ borderStyle: 'dashed', cursor: 'pointer', minHeight: 110 }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={26} className="text-muted mb-2" />
          <div className="text-muted small">
            Drag &amp; drop <strong>.xlsx</strong> or <strong>.csv</strong> here,
            or <span className="text-primary">click to browse</span>
          </div>
          <div className="small text-muted mt-1">Max {MAX_FILE_SIZE_MB} MB</div>
        </div>
      )}

      {/* Selected file row — shown after file loads */}
      {fileLoaded && (
        <div className="d-flex align-items-center gap-2 mb-3 p-2 border rounded bg-light">
          <span className="small text-truncate flex-grow-1">{fileName}</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary py-0 px-1"
            title="Change file"
            onClick={() => { resetFile(); fileRef.current?.click(); }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.csv"
        className="d-none"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {loading && (
        <div className="text-center text-muted mb-2 small">
          <div className="spinner-border spinner-border-sm me-2" />
          Reading file…
        </div>
      )}

      {fileError && <div className="alert alert-danger py-2 small">{fileError}</div>}

      {/* Sheet picker — shown as soon as sheets are detected */}
      {sheets.length > 0 && (
        <div className="mb-3">
          <p className="small fw-semibold mb-2">Select worksheet ({sheets.length} found):</p>
          <div className="border rounded p-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
            {sheets.map((s, i) => (
              <div
                key={i}
                className={`d-flex align-items-center gap-2 px-2 py-1 rounded mb-1 ${selectedSheet === s ? 'bg-primary text-white' : 'hover-bg-light'}`}
                style={{ cursor: 'pointer', fontSize: 13 }}
                onClick={() => setSelectedSheet(s)}
              >
                <input
                  type="radio"
                  className="form-check-input mt-0"
                  name="sheet-select"
                  checked={selectedSheet === s}
                  onChange={() => setSelectedSheet(s)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ flexShrink: 0 }}
                />
                <span>{s}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary mt-2"
            disabled={!selectedSheet || loading}
            onClick={handleSheetConfirm}
          >
            Continue with "{selectedSheet}"
          </button>
        </div>
      )}

      {/* Recent PO duplicate warning */}
      {recentMatches.length > 0 && pendingSheet && (
        <div className="alert alert-warning py-2">
          <strong>⚠ {recentMatches.length} item(s) ordered in last 30 days:</strong>
          <ul className="mb-2 mt-1 small">
            {recentMatches.slice(0, 5).map((m) => (
              <li key={m.itemcode}>
                {m.itemcode} — PO#{m.ponumber} on {new Date(m.podate).toLocaleDateString()}
              </li>
            ))}
            {recentMatches.length > 5 && <li>…and {recentMatches.length - 5} more</li>}
          </ul>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-sm btn-warning" onClick={() => onNext(pendingSheet, fileName)}>
              Continue Anyway
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={resetFile}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <ImportHistoryDrawer storeId={storeId} show={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
}
