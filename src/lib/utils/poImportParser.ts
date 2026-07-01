import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface RawSheet {
  name: string;
  rows: string[][];
  colCount: number;
}

export const DEFAULT_UNITS = [
  { value: 'Pc', label: 'Pc – By Piece' },
  { value: 'Wt', label: 'Wt – By Weight' },
];

export function columnLetter(index: number): string {
  let result = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

// Strip control characters (tab, ESC, other hidden chars), then trim spaces
export function cleanCell(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  // eslint-disable-next-line no-control-regex
  return String(raw).replace(/[\t\r\n\x00-\x1F\x7F]/g, '').trim();
}

// Parse a number from a string that may have $, €, commas, or European decimals
export function cleanNumeric(raw: unknown): number | null {
  const s = cleanCell(raw)
    .replace(/[$€£¥₹]/g, '')
    .replace(/\s/g, '');
  if (!s) return null;
  let normalized = s;
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(s)) {
    // "1.500,00" — dots = thousands separators, comma = decimal
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+(,\d{1,2})$/.test(s)) {
    // "1500,00" — single comma as decimal
    normalized = s.replace(',', '.');
  } else {
    // US style: strip thousands commas
    normalized = s.replace(/,(?=\d{3})/g, '');
  }
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

// Read workbook from file using SheetJS (reliable browser support)
// NOTE: SheetJS type:'array' requires Uint8Array, NOT ArrayBuffer — must convert first
async function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  return XLSX.read(data, { type: 'array' });
}

export async function loadExcelSheets(file: File): Promise<string[]> {
  const wb = await readWorkbook(file);
  console.log('[POImport] SheetNames from SheetJS:', wb.SheetNames);
  return wb.SheetNames;
}

export async function loadSheetData(file: File, sheetName: string): Promise<RawSheet> {
  const wb = await readWorkbook(file);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Worksheet "${sheetName}" not found`);

  // Convert to array of arrays (all values as strings, include blank cells)
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: '',
    blankrows: true,
    raw: false, // format dates/numbers as strings
  });

  let maxCols = 0;
  const rows: string[][] = raw.map((row) => {
    const cells = (row as unknown[]).map((cell) => cleanCell(cell));
    if (cells.length > maxCols) maxCols = cells.length;
    return cells;
  });

  // Pad short rows to uniform width
  for (const r of rows) {
    while (r.length < maxCols) r.push('');
  }

  return { name: sheetName, rows, colCount: maxCols };
}

export async function parseCsvFile(file: File): Promise<RawSheet> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: false,
      encoding: '', // auto-detect via BOM
      complete(result) {
        const rawRows = result.data as string[][];
        let maxCols = 0;
        const rows = rawRows.map((row) => {
          const cleaned = row.map(cleanCell);
          if (cleaned.length > maxCols) maxCols = cleaned.length;
          return cleaned;
        });
        for (const r of rows) {
          while (r.length < maxCols) r.push('');
        }
        resolve({ name: 'CSV', rows, colCount: maxCols });
      },
      error(err) {
        reject(new Error(err.message));
      },
    });
  });
}
