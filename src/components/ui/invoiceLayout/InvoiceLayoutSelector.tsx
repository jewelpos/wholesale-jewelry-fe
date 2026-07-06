"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import api from "@/lib/axios";
import useStores from "@/hooks/useStores";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";

type DefaultTemplate = "compact" | "thumbnail" | "barcode";
type Template = DefaultTemplate | "packing_slip";

interface LayoutOption {
  id: Template;
  title: string;
  bullets: string[];
  mockup: React.ReactNode;
  previewOnly?: boolean;
}

const NavBar = () => (
  <div style={{ background: "#283660", height: 14, borderRadius: "3px 3px 0 0" }} />
);

const MockRow = ({ shade }: { shade?: boolean }) => (
  <div style={{ display: "flex", gap: 3, padding: "2px 0", background: shade ? "#f4f5fc" : undefined }}>
    <div style={{ width: 12, height: 5, background: "#d0d3dc", borderRadius: 1 }} />
    <div style={{ flex: 1, height: 5, background: "#dde0e8", borderRadius: 1 }} />
    <div style={{ width: 16, height: 5, background: "#dde0e8", borderRadius: 1 }} />
    <div style={{ width: 16, height: 5, background: "#dde0e8", borderRadius: 1 }} />
  </div>
);

const HeaderRow = () => (
  <div style={{ display: "flex", gap: 3, padding: "3px 0", background: "#3b4b72" }}>
    <div style={{ width: 12, height: 5, background: "rgba(255,255,255,.45)", borderRadius: 1 }} />
    <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,.45)", borderRadius: 1 }} />
    <div style={{ width: 16, height: 5, background: "rgba(255,255,255,.45)", borderRadius: 1 }} />
    <div style={{ width: 16, height: 5, background: "rgba(255,255,255,.45)", borderRadius: 1 }} />
  </div>
);

const CompactMockup = () => (
  <div style={{ border: "1px solid #e0e3ec", borderRadius: 4, overflow: "hidden", fontSize: 0 }}>
    <NavBar />
    <div style={{ background: "#fff", padding: "4px 6px 6px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 60, height: 5, background: "#283660", borderRadius: 1, marginBottom: 2 }} />
          <div style={{ width: 40, height: 4, background: "#c8cad6", borderRadius: 1 }} />
        </div>
        <div style={{ width: 44, border: "1px solid #e0e3ec", borderRadius: 2, padding: "2px 3px" }}>
          <div style={{ height: 3, background: "#d0d3dc", marginBottom: 2, borderRadius: 1 }} />
          <div style={{ height: 3, background: "#d0d3dc", borderRadius: 1 }} />
        </div>
      </div>
      <HeaderRow />
      {[0, 1, 2].map(i => <MockRow key={i} shade={i % 2 === 1} />)}
      <div style={{ height: 4, background: "#f0f0f0", marginTop: 3, borderRadius: 1 }} />
    </div>
  </div>
);

const ThumbnailMockup = () => (
  <div style={{ border: "1px solid #e0e3ec", borderRadius: 4, overflow: "hidden" }}>
    <NavBar />
    <div style={{ background: "#fff", padding: "4px 6px 6px" }}>
      <HeaderRow />
      {[0, 1, 2].map(i => (
        <div key={i} style={{ display: "flex", gap: 3, padding: "3px 0", background: i % 2 === 1 ? "#f4f5fc" : undefined, alignItems: "center" }}>
          <div style={{ width: 14, height: 14, background: "#e0e3ec", borderRadius: 2, flexShrink: 0 }} />
          <div style={{ width: 10, height: 5, background: "#d0d3dc", borderRadius: 1 }} />
          <div style={{ flex: 1, height: 5, background: "#dde0e8", borderRadius: 1 }} />
          <div style={{ width: 16, height: 5, background: "#dde0e8", borderRadius: 1 }} />
        </div>
      ))}
    </div>
  </div>
);

const BarcodeMockup = () => (
  <div style={{ border: "1px solid #e0e3ec", borderRadius: 4, overflow: "hidden" }}>
    <NavBar />
    <div style={{ background: "#fff", padding: "4px 6px 6px" }}>
      <HeaderRow />
      {[0, 1, 2].map(i => (
        <div key={i} style={{ display: "flex", gap: 3, padding: "3px 0", background: i % 2 === 1 ? "#f4f5fc" : undefined, alignItems: "center" }}>
          <div style={{ width: 10, height: 5, background: "#d0d3dc", borderRadius: 1 }} />
          <div style={{ display: "flex", gap: "1px", alignItems: "flex-end", height: 12, width: 28 }}>
            {Array.from({ length: 10 }).map((_, j) => (
              <div key={j} style={{ width: 2, background: "#334", height: [10,7,12,8,11,9,12,7,10,9][j] }} />
            ))}
          </div>
          <div style={{ flex: 1, height: 5, background: "#dde0e8", borderRadius: 1 }} />
          <div style={{ width: 16, height: 5, background: "#dde0e8", borderRadius: 1 }} />
        </div>
      ))}
    </div>
  </div>
);

const PackingMockup = () => (
  <div style={{ border: "1px solid #e0e3ec", borderRadius: 4, overflow: "hidden" }}>
    <NavBar />
    <div style={{ background: "#fff", padding: "4px 6px 6px" }}>
      <div style={{ display: "flex", gap: 3, padding: "3px 0", background: "#3b4b72" }}>
        <div style={{ width: 12, height: 5, background: "rgba(255,255,255,.45)", borderRadius: 1 }} />
        <div style={{ flex: 2, height: 5, background: "rgba(255,255,255,.45)", borderRadius: 1 }} />
        <div style={{ width: 20, height: 5, background: "rgba(255,255,255,.45)", borderRadius: 1 }} />
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ display: "flex", gap: 3, padding: "2px 0", background: i % 2 === 1 ? "#f4f5fc" : undefined }}>
          <div style={{ width: 12, height: 5, background: "#d0d3dc", borderRadius: 1 }} />
          <div style={{ flex: 2, height: 5, background: "#dde0e8", borderRadius: 1 }} />
          <div style={{ width: 20, height: 5, background: "#dde0e8", borderRadius: 1 }} />
        </div>
      ))}
      <div style={{ marginTop: 4, height: 4, background: "#f0f0f0", borderRadius: 1 }} />
    </div>
  </div>
);

const LAYOUTS: LayoutOption[] = [
  {
    id: "compact",
    title: "Standard",
    bullets: ["Clean 7-column grid", "Unit price, discount & extended amount", "Bill To / Ship To with details strip"],
    mockup: <CompactMockup />,
  },
  {
    id: "thumbnail",
    title: "With Photos",
    bullets: ["Item image thumbnail on each row", "Ideal for visual product catalogs", "8-column layout with 55pt row height"],
    mockup: <ThumbnailMockup />,
  },
  {
    id: "barcode",
    title: "With Barcodes",
    bullets: ["CODE128 barcode printed per item", "Useful for warehouse / pick lists", "7-column layout with scannable codes"],
    mockup: <BarcodeMockup />,
  },
  {
    id: "packing_slip",
    title: "Packing Slip",
    bullets: ["No prices — for packing & shipping", "4-column: #, code, description, qty", "Signature line at the bottom"],
    mockup: <PackingMockup />,
    previewOnly: true,
  },
];

const InvoiceLayoutSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { refetchCurrentStore } = useStores();
  const storeData = useAppSelector((state) => state.store.data);
  const parsedStoreId = Number(storeData?.storeid);

  const [selected, setSelected] = useState<DefaultTemplate>(() => {
    const stored = storeData?.defaultprintlayout as Template | undefined;
    return (stored && stored !== "packing_slip" ? stored : "compact") as DefaultTemplate;
  });
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState<Template | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handlePreview = async (t: Template) => {
    setPreviewing(t);
    try {
      const response = await api.get(`/store/invoice/layout-preview`, {
        params: { storeid: parsedStoreId, template: t },
        responseType: "blob",
      });
      if (response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        setPdfUrl(url);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Preview failed";
      dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setPreviewing(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/store/invoice/save-default-layout`, { storeid: parsedStoreId, layout: selected });
      await refetchCurrentStore();
      dispatch(showNotification({ message: "Default layout saved", type: NOTIFICATION_TYPES.SUCCESS }));
      router.back();
    } catch {
      dispatch(showNotification({ message: "Failed to save layout", type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content">
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontWeight: 700, margin: 0 }}>Invoice Print Layout</h4>
        <p style={{ color: "#888", marginTop: 4, marginBottom: 0 }}>
          Choose how invoices look when printed or previewed. You can change this any time.
        </p>
      </div>

      <div className="row g-3" style={{ marginBottom: 80 }}>
        {LAYOUTS.map((layout) => {
          const isSelected = selected === layout.id;
          const isPreviewOnly = !!layout.previewOnly;
          return (
            <div key={layout.id} className="col-12 col-sm-6 col-xl-3">
              <div
                onClick={() => { if (!isPreviewOnly) setSelected(layout.id as DefaultTemplate); }}
                style={{
                  border: `2px ${isPreviewOnly ? "dashed" : "solid"} ${isSelected ? "#283660" : "#e0e3ec"}`,
                  borderRadius: 8,
                  padding: 16,
                  cursor: isPreviewOnly ? "default" : "pointer",
                  background: isPreviewOnly ? "#fafafa" : isSelected ? "#f0f3fa" : "#fff",
                  transition: "border-color .15s, background .15s",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ flexShrink: 0 }}>{layout.mockup}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    {isPreviewOnly ? (
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: "#888",
                        background: "#ebebeb", borderRadius: 4,
                        padding: "1px 6px", letterSpacing: 0.3, flexShrink: 0,
                      }}>
                        PREVIEW ONLY
                      </span>
                    ) : (
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%",
                        border: `2px solid ${isSelected ? "#283660" : "#aab"}`,
                        background: isSelected ? "#283660" : "#fff",
                        flexShrink: 0,
                      }} />
                    )}
                    <span style={{ fontWeight: 700, fontSize: 14, color: isPreviewOnly ? "#888" : undefined }}>{layout.title}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#666", lineHeight: 1.6 }}>
                    {layout.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  style={{ fontSize: 12 }}
                  disabled={previewing === layout.id}
                  onClick={(e) => { e.stopPropagation(); handlePreview(layout.id); }}
                >
                  {previewing === layout.id ? "Loading…" : "Preview PDF"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky footer */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "#fff", borderTop: "1px solid #e0e3ec",
        padding: "12px 24px", display: "flex", justifyContent: "flex-end", gap: 10,
      }}>
        <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save as Default"}
        </button>
      </div>

      {pdfUrl && (
        <PdfPreviewModal
          pdfUrl={pdfUrl}
          filename="invoice-preview.pdf"
          onClose={() => setPdfUrl(null)}
        />
      )}
    </div>
  );
};

export default InvoiceLayoutSelector;
