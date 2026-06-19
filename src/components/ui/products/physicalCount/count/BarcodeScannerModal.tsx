"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Camera } from "lucide-react";

interface BatchItem {
  countitemid: number;
  itemcode: string | null;
  itemdescription: string | null;
  itemtype: string | null;
}

interface Props {
  show: boolean;
  items: BatchItem[];
  onClose: () => void;
  onItemFound: (item: BatchItem) => void;
  onQtyEntry: (item: BatchItem) => void;
}

const BarcodeScannerModal = ({ show, items, onClose, onItemFound, onQtyEntry }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<import("@zxing/browser").BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const stopCamera = useCallback(() => {
    readerRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!show) { stopCamera(); return; }

    let cancelled = false;
    const start = async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled) return;
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setScanning(true);
        setError(null);

        reader.decodeFromStream(stream, videoRef.current!, (result) => {
          if (!result) return;
          const code = result.getText();
          const found = items.find(i => (i.itemcode ?? "").toLowerCase() === code.toLowerCase());
          if (found) {
            setLastScanned(code);
            if (navigator.vibrate) navigator.vibrate(30);
            if (found.itemtype === "Pc") {
              onItemFound(found);
            } else {
              onQtyEntry(found);
            }
          } else {
            setLastScanned(`❌ Not found: ${code}`);
          }
        });
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Camera error";
          setError(msg.includes("Permission") ? "Camera permission denied. Allow camera access and try again." : msg);
        }
      }
    };
    start();
    return () => { cancelled = true; stopCamera(); };
  }, [show, items, onItemFound, onQtyEntry, stopCamera]);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1055,
        backgroundColor: "rgba(0,0,0,0.92)",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center p-3" style={{ color: "#fff" }}>
        <div className="d-flex align-items-center gap-2">
          <Camera size={18} />
          <span style={{ fontWeight: 600 }}>Scan Barcode</span>
        </div>
        <button className="btn btn-sm btn-outline-light" onClick={onClose}><X size={16} /></button>
      </div>

      {/* Viewfinder */}
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {error ? (
          <div className="text-center p-4" style={{ color: "#ef4444" }}>
            <p style={{ fontSize: 14 }}>{error}</p>
            <button className="btn btn-sm btn-outline-danger" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: "100%", maxWidth: 480, maxHeight: "60vh", objectFit: "cover" }}
            />
            {/* Scan line overlay */}
            <div style={{
              position: "absolute", left: "50%", transform: "translateX(-50%)",
              width: 240, height: 2, backgroundColor: "#6366f1",
              boxShadow: "0 0 8px #6366f1",
              animation: "scanline 1.5s ease-in-out infinite alternate",
            }} />
          </>
        )}
      </div>

      {/* Status chip */}
      <div className="text-center p-3" style={{ color: "#94a3b8", fontSize: 13 }}>
        {scanning && !error && (
          <span>Point camera at barcode</span>
        )}
        {lastScanned && (
          <div
            style={{
              marginTop: 8, padding: "4px 12px", borderRadius: 20, display: "inline-block",
              backgroundColor: lastScanned.startsWith("❌") ? "#ef444422" : "#10b98122",
              color: lastScanned.startsWith("❌") ? "#ef4444" : "#10b981",
              fontSize: 12, fontWeight: 600,
            }}
          >
            {lastScanned}
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          from { top: 25%; }
          to { top: 75%; }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScannerModal;
