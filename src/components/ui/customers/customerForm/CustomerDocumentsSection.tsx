"use client";

import React, { useRef, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { createPortal } from "react-dom";
import { Eye, Download, Trash2, Upload, FileText, X } from "lucide-react";
import dayjs from "dayjs";
import { getAccessToken } from "@/lib/authStorage";
import { GET_CUSTOMER_DOCUMENTS_QUERY } from "@/lib/graphql/query/customerDocuments";
import { DELETE_CUSTOMER_DOCUMENT_MUTATION } from "@/lib/graphql/mutations/customerDocuments";

interface CustomerDocument {
  documentid: number;
  customerid: number;
  documentname: string;
  documenttype: string;
  s3url: string;
  s3key: string;
  filesize: number;
  uploadeddate: string;
  uploadedby: string;
}

interface Props {
  customerid: number;
  storeid: number;
  pendingFiles?: File[];
  onAddPendingFile?: (file: File) => void;
  onRemovePendingFile?: (index: number) => void;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function canPreview(mimeType: string): "image" | "pdf" | null {
  if (!mimeType) return null;
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return null;
}

export default function CustomerDocumentsSection({ customerid, storeid, pendingFiles = [], onAddPendingFile, onRemovePendingFile }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<CustomerDocument | null>(null);

  const isNewCustomer = !customerid;

  const { data, loading, refetch } = useQuery(GET_CUSTOMER_DOCUMENTS_QUERY, {
    variables: { storeid, customerid },
    skip: !storeid || !customerid,
    fetchPolicy: "network-only",
  });

  const [deleteDocument] = useMutation(DELETE_CUSTOMER_DOCUMENT_MUTATION, {
    onCompleted: () => refetch(),
  });

  const raw: CustomerDocument[] = data?.getCustomerDocuments ?? [];
  const documents = [...new Map(raw.map(d => [d.documentid, d])).values()];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    e.target.value = "";

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("storeid", String(storeid));
      formData.append("customerid", String(customerid));
      formData.append("documentname", file.name);
      const token = await getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      await fetch("/api/proxy/store/customer/document/upload", {
        method: "POST",
        body: formData,
        headers,
      });
      refetch();
    } catch (err: any) {
      console.error("Upload failed", err);
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  };

  const handleDelete = async (doc: CustomerDocument) => {
    if (!confirm(`Delete "${doc.documentname}"?`)) return;
    await deleteDocument({ variables: { documentid: doc.documentid, storeid } });
  };

  return (
    <div
      className="card mt-3"
      style={{ border: "1px solid #e9ecef", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
    >
      <div
        className="card-header py-3 d-flex justify-content-between align-items-center"
        style={{ background: "#fff", borderBottom: "1px solid #e9ecef", borderLeft: "3px solid #0d6efd" }}
      >
        <h6
          className="mb-0 fw-semibold d-flex align-items-center gap-2"
          style={{ fontSize: 13, color: "#495057" }}
        >
          <FileText size={14} strokeWidth={2} color="#0d6efd" />
          Customer Documents
        </h6>
        {isNewCustomer ? (
          <>
            <input
              ref={pendingInputRef}
              type="file"
              accept="*/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAddPendingFile?.(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              style={{ fontSize: 12 }}
              onClick={() => pendingInputRef.current?.click()}
            >
              <Upload size={12} />
              Attach File
            </button>
          </>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              style={{ display: "none" }}
              onChange={handleUpload}
            />
            <button
              type="button"
              className="btn btn-sm btn-primary d-flex align-items-center gap-1"
              style={{ fontSize: 12 }}
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={12} />
              {uploading ? "Uploading..." : "Upload File"}
            </button>
          </>
        )}
      </div>

      <div className="card-body p-0">
        {isNewCustomer ? (
          pendingFiles.length === 0 ? (
            <div className="p-3 text-muted" style={{ fontSize: 13 }}>
              No files attached. Files will be uploaded when you save.
            </div>
          ) : (
            <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th style={{ padding: "8px 12px", fontWeight: 600 }}>Name</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600 }}>Size</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {pendingFiles.map((f, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "7px 12px" }}>{f.name}</td>
                    <td style={{ padding: "7px 12px", color: "#6c757d" }}>{formatBytes(f.size)}</td>
                    <td style={{ padding: "7px 12px" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#fff3cd", color: "#856404", border: "1px solid #ffc107" }}>
                        Pending
                      </span>
                    </td>
                    <td style={{ padding: "7px 12px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => onRemovePendingFile?.(i)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#dc3545" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : loading ? (
          <div className="p-3 text-muted" style={{ fontSize: 13 }}>
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-3 text-muted" style={{ fontSize: 13 }}>
            No documents uploaded yet.
          </div>
        ) : (
          <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
            <thead style={{ background: "#f8f9fa" }}>
              <tr>
                <th style={{ padding: "8px 12px", fontWeight: 600 }}>Name</th>
                <th style={{ padding: "8px 12px", fontWeight: 600 }}>Type</th>
                <th style={{ padding: "8px 12px", fontWeight: 600 }}>Size</th>
                <th style={{ padding: "8px 12px", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "8px 12px", fontWeight: 600 }}>Uploaded By</th>
                <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const previewType = canPreview(doc.documenttype);
                return (
                  <tr key={doc.documentid} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "7px 12px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.documentname}
                    </td>
                    <td style={{ padding: "7px 12px", color: "#6c757d" }}>
                      {doc.documenttype || "—"}
                    </td>
                    <td style={{ padding: "7px 12px", color: "#6c757d" }}>
                      {formatBytes(doc.filesize)}
                    </td>
                    <td style={{ padding: "7px 12px", color: "#6c757d", whiteSpace: "nowrap" }}>
                      {doc.uploadeddate ? dayjs(doc.uploadeddate).format("MM/DD/YY HH:mm") : "—"}
                    </td>
                    <td style={{ padding: "7px 12px", color: "#6c757d" }}>
                      {doc.uploadedby || "—"}
                    </td>
                    <td style={{ padding: "7px 12px", textAlign: "right" }}>
                      <div className="d-flex justify-content-end gap-2">
                        {/* Preview */}
                        <button
                          type="button"
                          title={previewType ? "Preview" : "Preview not available for this file type"}
                          disabled={!previewType}
                          onClick={() => previewType && setPreviewDoc(doc)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: previewType ? "pointer" : "not-allowed",
                            padding: 2,
                            color: previewType ? "#0d6efd" : "#ccc",
                          }}
                        >
                          <Eye size={14} />
                        </button>
                        {/* Download */}
                        <a
                          href={doc.s3url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          title="Download"
                          style={{ color: "#198754", padding: 2, display: "flex", alignItems: "center" }}
                        >
                          <Download size={14} />
                        </a>
                        {/* Delete */}
                        {(
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => handleDelete(doc)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 2,
                              color: "#dc3545",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Preview modal */}
      {previewDoc &&
        createPortal(
          <div
            onClick={() => setPreviewDoc(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff",
                borderRadius: 8,
                overflow: "hidden",
                maxWidth: "90vw",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}
            >
              {/* Modal header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 16px",
                  borderBottom: "1px solid #e9ecef",
                  background: "#f8f9fa",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "#495057" }}>
                  {previewDoc.documentname}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#6c757d" }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal body */}
              {canPreview(previewDoc.documenttype) === "image" ? (
                <img
                  src={previewDoc.s3url}
                  alt={previewDoc.documentname}
                  style={{ maxWidth: "80vw", maxHeight: "80vh", objectFit: "contain", display: "block" }}
                />
              ) : (
                <embed
                  src={previewDoc.s3url}
                  type="application/pdf"
                  style={{ width: "80vw", height: "80vh" }}
                />
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
