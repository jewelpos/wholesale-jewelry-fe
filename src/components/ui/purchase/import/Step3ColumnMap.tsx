'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { columnLetter, DEFAULT_UNITS, RawSheet } from '@/lib/utils/poImportParser';
import {
  GET_IMPORT_MAPPING_TEMPLATES,
} from '@/lib/graphql/query/poImport';
import {
  DELETE_IMPORT_MAPPING_TEMPLATE,
  SAVE_IMPORT_MAPPING_TEMPLATE,
} from '@/lib/graphql/mutations/poImport';
import {
  GET_ITEM_CATEGORIES_QUERY,
  GET_ITEM_SUBCATEGORIES_QUERY,
} from '@/lib/graphql/query/products';

export interface ColumnMapping {
  itemcode: string;
  itemdescription: string;
  qtyordered: string;
  orderunitcost: string;
  imageurl: string;
  orddiscount: string;
  defaultUnit: string;
  categoryid?: number;
  subcategoryid?: number;
}

const EMPTY_MAPPING: ColumnMapping = {
  itemcode: '',
  itemdescription: '',
  qtyordered: '',
  orderunitcost: '',
  imageurl: '',
  orddiscount: '',
  defaultUnit: 'Pc',
};

const REQUIRED_FIELDS: (keyof ColumnMapping)[] = ['itemcode', 'itemdescription', 'qtyordered', 'orderunitcost'];

interface FieldDef {
  key: keyof ColumnMapping;
  label: string;
  required: boolean;
}

const FIELDS: FieldDef[] = [
  { key: 'itemcode', label: 'Item Code', required: true },
  { key: 'itemdescription', label: 'Description', required: true },
  { key: 'qtyordered', label: 'Qty Ordered', required: true },
  { key: 'orderunitcost', label: 'Unit Cost', required: true },
  { key: 'imageurl', label: 'Image URL', required: false },
  { key: 'orddiscount', label: 'Discount %', required: false },
];

interface Props {
  storeId: number;
  sheet: RawSheet;
  startRow: number;
  onNext: (mapping: ColumnMapping) => void;
  onBack: () => void;
}

export default function Step3ColumnMap({ storeId, sheet, startRow, onNext, onBack }: Props) {
  const [mapping, setMapping] = useState<ColumnMapping>({ ...EMPTY_MAPPING });
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);

  const headerRow = sheet.rows[startRow - 1] ?? [];
  const dataRows = sheet.rows.slice(startRow); // rows after header

  const { data: templatesData, refetch: refetchTemplates } = useQuery(GET_IMPORT_MAPPING_TEMPLATES, {
    variables: { storeid: storeId },
    fetchPolicy: 'network-only',
  });
  const templates = templatesData?.getImportMappingTemplates ?? [];

  const { data: categoriesData } = useQuery(GET_ITEM_CATEGORIES_QUERY, {
    variables: { storeid: storeId },
    fetchPolicy: 'cache-first',
  });
  const categories: { categoryid: number; categoryname: string }[] =
    categoriesData?.getItemCategories ?? [];

  const { data: subcategoriesData } = useQuery(GET_ITEM_SUBCATEGORIES_QUERY, {
    variables: { storeid: storeId, categoryid: categoryId ?? undefined },
    skip: !categoryId,
    fetchPolicy: 'cache-first',
  });
  const subcategories: { subcategoryid: number; subcategoryname: string }[] =
    subcategoriesData?.getItemSubcategories ?? [];

  const [saveMutation, { loading: savingTemplate }] = useMutation(SAVE_IMPORT_MAPPING_TEMPLATE);
  const [deleteMutation, { loading: deletingTemplate }] = useMutation(DELETE_IMPORT_MAPPING_TEMPLATE);

  function colOptions() {
    return Array.from({ length: sheet.colCount }, (_, i) => {
      const letter = columnLetter(i);
      const header = headerRow[i]?.trim();
      return { value: letter, label: header ? `${letter} – ${header}` : letter, index: i };
    });
  }

  function getSamples(colLetter: string): string[] {
    const colIndex = colLetter.charCodeAt(0) - 65; // single-letter only for now
    const samples: string[] = [];
    for (const row of dataRows) {
      const v = row[colIndex]?.trim();
      if (v && samples.length < 3) samples.push(v);
      if (samples.length === 3) break;
    }
    return samples;
  }

  function loadTemplate(templateId: number) {
    const tpl = templates.find((t: { templateid: number }) => t.templateid === templateId);
    if (!tpl) return;
    try {
      const cfg = JSON.parse(tpl.mappingconfig) as Partial<ColumnMapping>;
      setMapping({ ...EMPTY_MAPPING, ...cfg });
      setSelectedTemplateId(templateId);
    } catch {}
  }

  async function saveTemplate() {
    if (!saveTemplateName.trim()) return;
    await saveMutation({
      variables: {
        storeid: storeId,
        templatename: saveTemplateName.trim(),
        mappingconfig: JSON.stringify(mapping),
      },
    });
    setSaveTemplateName('');
    setShowSaveInput(false);
    refetchTemplates();
  }

  async function deleteTemplate() {
    if (!selectedTemplateId) return;
    await deleteMutation({ variables: { storeid: storeId, templateid: selectedTemplateId } });
    setSelectedTemplateId(null);
    refetchTemplates();
  }

  function setField(key: keyof ColumnMapping, value: string) {
    setMapping((prev) => ({ ...prev, [key]: value }));
  }

  const isValid = REQUIRED_FIELDS.every((f) => mapping[f]);

  const options = colOptions();

  return (
    <div>
      <h6 className="fw-semibold mb-3">Step 3 — Column Mapping</h6>

      {/* Template controls */}
      <div className="d-flex gap-2 mb-3 align-items-center flex-wrap">
        <select
          className="form-select form-select-sm"
          style={{ maxWidth: 220 }}
          value={selectedTemplateId ?? ''}
          onChange={(e) => { const id = parseInt(e.target.value, 10); if (!isNaN(id)) loadTemplate(id); }}
        >
          <option value="">Load Template…</option>
          {templates.map((t: { templateid: number; templatename: string }) => (
            <option key={t.templateid} value={t.templateid}>{t.templatename}</option>
          ))}
        </select>
        {selectedTemplateId && (
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            disabled={deletingTemplate}
            onClick={deleteTemplate}
          >
            Delete Template
          </button>
        )}
        {showSaveInput ? (
          <>
            <input
              type="text"
              className="form-control form-control-sm"
              style={{ maxWidth: 180 }}
              placeholder="Template name"
              value={saveTemplateName}
              onChange={(e) => setSaveTemplateName(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              className="btn btn-sm btn-success"
              disabled={!saveTemplateName.trim() || savingTemplate}
              onClick={saveTemplate}
            >
              Save
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowSaveInput(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setShowSaveInput(true)}>
            Save as Template
          </button>
        )}
      </div>

      {/* Mapping rows */}
      <div className="table-responsive mb-3">
        <table className="table table-sm table-bordered align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: 160 }}>PO Field</th>
              <th>Source Column</th>
              <th>Sample Values</th>
            </tr>
          </thead>
          <tbody>
            {FIELDS.map(({ key, label, required }) => (
              <tr key={key}>
                <td className="small fw-semibold">
                  {label}
                  {required && <span className="text-danger ms-1">*</span>}
                </td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={mapping[key]}
                    onChange={(e) => setField(key, e.target.value)}
                  >
                    <option value="">— Not mapped —</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </td>
                <td className="small text-muted">
                  {mapping[key] ? getSamples(mapping[key]).join(' · ') || '—' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Global options — Unit, Category, Sub-Category */}
      <div className="border rounded p-2 mb-3 bg-light">
        <div className="small fw-semibold mb-2 text-secondary">Applied to all imported items:</div>
        <div className="d-flex gap-3 flex-wrap align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">Unit:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={mapping.defaultUnit}
              onChange={(e) => setField('defaultUnit', e.target.value)}
            >
              {DEFAULT_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">Category:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 180 }}
              value={categoryId ?? ''}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : null;
                setCategoryId(v);
                setSubcategoryId(null);
              }}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.categoryid} value={c.categoryid}>{c.categoryname}</option>
              ))}
            </select>
          </div>
          {categoryId && (
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted">Sub-Category:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: 180 }}
                value={subcategoryId ?? ''}
                onChange={(e) => setSubcategoryId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— None —</option>
                {subcategories.map((s) => (
                  <option key={s.subcategoryid} value={s.subcategoryid}>{s.subcategoryname}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="d-flex gap-2">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onBack}>
          ← Back
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled={!isValid}
          onClick={() => onNext({
            ...mapping,
            categoryid: categoryId ?? undefined,
            subcategoryid: subcategoryId ?? undefined,
          })}
        >
          Next → Preview
        </button>
      </div>
    </div>
  );
}
