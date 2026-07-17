"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Tag } from "react-feather";
import { GET_ALL_INVENTORY_TAG_LABELS_QUERY } from "@/lib/graphql/query/products";
import { DELETE_INVENTORY_TAG_LABEL_MUTATION } from "@/lib/graphql/mutations/label";
import { LabelTemplate } from "./LabelCanvas";
import LabelTemplateFormModal from "./LabelTemplateFormModal";
import Swal from "sweetalert2";
import useMenu from "@/hooks/useMenu";

const LabelTemplatesComponent = () => {
  const router = useRouter();
  const { storeId: storeIdParam } = useParams();
  const { currentMenu } = useMenu();
  const canAdd = currentMenu?.action?.some((a: { actionname: string }) => a.actionname.includes("add"));
  const storeid = parseInt(storeIdParam as string, 10);

  const { data, loading, refetch } = useQuery(GET_ALL_INVENTORY_TAG_LABELS_QUERY, {
    variables: { storeid },
    skip: !storeid,
    fetchPolicy: "network-only",
  });

  const [deleteLabel, { loading: deleting }] = useMutation(DELETE_INVENTORY_TAG_LABEL_MUTATION);

  const [modalOpen, setModalOpen] = useState(false);
  const [editLabel, setEditLabel] = useState<LabelTemplate | null>(null);

  const labels: LabelTemplate[] = data?.getAllInventoryTagLabels ?? [];

  const handleNew = () => { setEditLabel(null); setModalOpen(true); };
  const handleEdit = (t: LabelTemplate) => { setEditLabel(t); setModalOpen(true); };
  const handleSaved = () => { setModalOpen(false); refetch(); };

  const handleDelete = async (t: LabelTemplate) => {
    const result = await Swal.fire({
      title: "Delete label template?",
      text: `"${t.labelname}" will be permanently removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteLabel({ variables: { storeid, labelid: t.labelid } });
      refetch();
    } catch (err: any) {
      Swal.fire("Error", err.message ?? "Failed to delete", "error");
    }
  };

  const TypeBadge = ({ type }: { type: string }) =>
    type === "rattail" ? (
      <span className="badge" style={{ background: "#ede9fe", color: "#6d28d9", fontSize: 11 }}>Rat-tail</span>
    ) : (
      <span className="badge" style={{ background: "#dcfce7", color: "#166534", fontSize: 11 }}>Rectangular</span>
    );

  const ActiveBadge = ({ active }: { active: string }) =>
    active === "1" || active === "\x01" ? (
      <span className="badge" style={{ background: "#dcfce7", color: "#166534", fontSize: 11 }}>Active</span>
    ) : (
      <span className="badge" style={{ background: "#f1f5f9", color: "#94a3b8", fontSize: 11 }}>Inactive</span>
    );

  const contentSummary = (t: LabelTemplate) => {
    const fields: string[] = [];
    if (t.showbarcode    === "1") fields.push("Barcode");
    if (t.showitemcode   === "1") fields.push("Code");
    if (t.showdescription=== "1") fields.push("Desc");
    if (t.showsellprice  === "1") fields.push("Price");
    if (t.showcodedprice === "1") fields.push("Coded");
    if (t.showcategory   === "1") fields.push("Category");
    return fields.join(", ") || "—";
  };

  return (
    <>
      <div className="page-header">
        <div className="add-item d-flex flex-column">
          <button
            type="button"
            onClick={() => router.back()}
            style={{ background: "none", border: "none", padding: 0, marginBottom: 4, display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", cursor: "pointer" }}
          >
            ← Back
          </button>
          <div className="page-title">
            <h4>Label Templates</h4>
            <h6>Configure rat-tail and rectangular price tag templates</h6>
          </div>
        </div>
        {canAdd && (
          <div className="page-btn">
            <button className="btn btn-added d-flex align-items-center gap-2" onClick={handleNew}>
              <Plus size={14} />
              New Template
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
        {loading ? (
          <div className="text-center py-5 text-muted" style={{ fontSize: 13 }}>Loading templates…</div>
        ) : labels.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-3" style={{ color: "#cbd5e1" }}><Tag size={40} /></div>
            <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>No label templates yet</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>Create your first template to start printing price tags</div>
            <button className="btn btn-submit" onClick={handleNew}><Plus size={13} className="me-1" />Create Template</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0" style={{ fontSize: 12 }}>
              <thead style={{ fontSize: 11, backgroundColor: "var(--surface-secondary)", borderBottom: "2px solid var(--border-subtle)" }}>
                <tr>
                  <th className="px-3 py-2">Label Name</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Size (W × H)</th>
                  <th className="py-2">Margins</th>
                  <th className="py-2">Content</th>
                  <th className="py-2">Coded Prefix/Suffix</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-end px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {labels.map((t) => (
                  <tr key={t.labelid} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td className="px-3 fw-semibold" style={{ color: "#1e293b" }}>{t.labelname}</td>
                    <td><TypeBadge type={t.labletype} /></td>
                    <td style={{ color: "#475569" }}>
                      {t.labelwidth}"&nbsp;×&nbsp;
                      {t.labletype === "rattail"
                        ? `${(Number(t.labelheight || 0) * 2 + Number(t.middlemargin || 0)).toFixed(2)}" total`
                        : `${t.labelheight}"`}
                    </td>
                    <td style={{ color: "#64748b" }}>
                      L:{t.leftmargin || 0}" T:{t.topmargin || 0}"
                      {t.labletype === "rattail" && <span> BkT:{t.middlemargin || 0}"</span>}
                    </td>
                    <td style={{ color: "#475569", maxWidth: 160 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {contentSummary(t)}
                      </div>
                    </td>
                    <td style={{ color: "#475569" }}>
                      {t.tagprefix || t.tagsuffix
                        ? <span><code style={{ fontSize: 11 }}>{t.tagprefix || "—"}</code> / <code style={{ fontSize: 11 }}>{t.tagsuffix || "—"}</code></span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td><ActiveBadge active={t.isactive ?? "0"} /></td>
                    <td className="text-end px-3">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-sm btn-outline-primary" style={{ padding: "3px 8px" }}
                          onClick={() => handleEdit(t)} title="Edit">
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" style={{ padding: "3px 8px" }}
                          onClick={() => handleDelete(t)} disabled={deleting} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <LabelTemplateFormModal
          storeid={storeid}
          editLabel={editLabel}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
};

export default LabelTemplatesComponent;
