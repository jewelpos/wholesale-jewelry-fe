"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import useFieldVisibility from "@/hooks/useFieldVisibility";
import { FormKey, HideableFieldDef } from "@/lib/formFieldVisibility/types";

interface Props {
  formkey: FormKey;
  fields: HideableFieldDef[];
  bulkToggle?: { key: string; label: string; description?: string };
}

const FormFieldVisibilitySettings = ({ formkey, fields, bulkToggle }: Props) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const { hiddenFields, loading, save, saving } = useFieldVisibility(formkey, parsedStoreId);
  const [localHidden, setLocalHidden] = useState<Set<string>>(new Set());
  const [loadedOnce, setLoadedOnce] = useState(false);

  useEffect(() => {
    if (!loading && !loadedOnce) {
      setLocalHidden(new Set(hiddenFields));
      setLoadedOnce(true);
    }
  }, [loading, loadedOnce, hiddenFields]);

  const sections = useMemo(() => {
    const grouped = new Map<string, HideableFieldDef[]>();
    fields.forEach((f) => {
      if (!grouped.has(f.section)) grouped.set(f.section, []);
      grouped.get(f.section)!.push(f);
    });
    return Array.from(grouped.entries());
  }, [fields]);

  const isDirty = useMemo(() => {
    if (localHidden.size !== hiddenFields.size) return true;
    for (const key of localHidden) if (!hiddenFields.has(key)) return true;
    return false;
  }, [localHidden, hiddenFields]);

  const toggleField = (key: string) => {
    setLocalHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const setSectionAll = (sectionFields: HideableFieldDef[], visible: boolean) => {
    setLocalHidden((prev) => {
      const next = new Set(prev);
      sectionFields.forEach((f) => {
        if (visible) next.delete(f.key);
        else next.add(f.key);
      });
      return next;
    });
  };

  const handleSave = async () => {
    const ok = await save(Array.from(localHidden));
    if (ok) setLoadedOnce(false); // pick up the freshly-saved server state on next load
  };

  if (loading && !loadedOnce) {
    return <div className="text-muted py-4 text-center">Loading…</div>;
  }

  return (
    <div>
      {bulkToggle && (
        <div
          className="d-flex align-items-center justify-content-between mb-4 p-3"
          style={{ background: "#f8f9fa", borderRadius: 8, border: "1px solid #e9ecef" }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{bulkToggle.label}</div>
            {bulkToggle.description && (
              <div className="text-muted" style={{ fontSize: 12 }}>{bulkToggle.description}</div>
            )}
          </div>
          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              checked={!localHidden.has(bulkToggle.key)}
              onChange={() => toggleField(bulkToggle.key)}
              style={{ width: 40, height: 22 }}
            />
          </div>
        </div>
      )}

      {sections.map(([section, sectionFields]) => (
        <div key={section} className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#6c757d", textTransform: "uppercase" }}>
              {section}
            </span>
            <div style={{ fontSize: 12 }}>
              <button type="button" className="btn btn-link btn-sm p-0 me-2" onClick={() => setSectionAll(sectionFields, true)}>
                Show all
              </button>
              <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setSectionAll(sectionFields, false)}>
                Hide all
              </button>
            </div>
          </div>
          <div className="row g-2">
            {sectionFields.map((f) => (
              <div key={f.key} className="col-lg-4 col-md-6">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id={`ffv-${formkey}-${f.key}`}
                    checked={!localHidden.has(f.key)}
                    onChange={() => toggleField(f.key)}
                  />
                  <label className="form-check-label" htmlFor={`ffv-${formkey}-${f.key}`} style={{ fontSize: 13 }}>
                    {f.label}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="d-flex justify-content-end pt-2 border-top">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!isDirty || saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default FormFieldVisibilitySettings;
