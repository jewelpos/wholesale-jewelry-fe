'use client';

import { createPortal } from 'react-dom';
import { useState } from 'react';
import { X } from 'lucide-react';
import Step1Upload from './Step1Upload';
import Step2RawPreview from './Step2RawPreview';
import Step3ColumnMap, { ColumnMapping } from './Step3ColumnMap';
import Step4Preview, { ImportedPOItem } from './Step4Preview';
import { RawSheet } from '@/lib/utils/poImportParser';

interface Props {
  storeId: number;
  userId: number;
  warehouseId?: number;
  onClose: () => void;
  onDone: (items: ImportedPOItem[]) => void;
}

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Upload', 'Preview', 'Map Columns', 'Import'];

export default function POImportWizard({ storeId, userId, warehouseId, onClose, onDone }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [sheet, setSheet] = useState<RawSheet | null>(null);
  const [fileName, setFileName] = useState('');
  const [startRow, setStartRow] = useState(1);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="bg-white rounded shadow-lg d-flex flex-column"
        style={{ width: '100%', maxWidth: 900, maxHeight: '92vh', overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
          <div>
            <h5 className="mb-0 fw-bold">Import from File</h5>
            {/* Step indicator */}
            <div className="d-flex gap-1 mt-1">
              {STEP_LABELS.map((label, i) => (
                <span
                  key={i}
                  className={`badge ${i + 1 === step ? 'bg-primary' : i + 1 < step ? 'bg-success' : 'bg-secondary bg-opacity-25 text-secondary'}`}
                  style={{ fontSize: 11 }}
                >
                  {i + 1}. {label}
                </span>
              ))}
            </div>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-grow-1 overflow-auto p-4">
          {step === 1 && (
            <Step1Upload
              storeId={storeId}
              onNext={(s, name) => { setSheet(s); setFileName(name); setStep(2); }}
            />
          )}
          {step === 2 && sheet && (
            <Step2RawPreview
              sheet={sheet}
              onNext={(sr) => { setStartRow(sr); setStep(3); }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && sheet && (
            <Step3ColumnMap
              storeId={storeId}
              sheet={sheet}
              startRow={startRow}
              onNext={(m) => { setMapping(m); setStep(4); }}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && sheet && mapping && (
            <Step4Preview
              storeId={storeId}
              userId={userId}
              warehouseId={warehouseId}
              fileName={fileName}
              sheet={sheet}
              startRow={startRow}
              mapping={mapping}
              onBack={() => setStep(3)}
              onDone={onDone}
            />
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
