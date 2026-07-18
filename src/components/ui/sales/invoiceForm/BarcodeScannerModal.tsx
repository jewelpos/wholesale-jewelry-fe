"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

type Props = {
  onScan: (code: string) => void;
  onClose: () => void;
};

export const BarcodeScannerModal = ({ onScan, onClose }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const scannedRef = useRef(false);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();

    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devices) => {
        if (!devices.length) {
          setError("No camera found on this device.");
          return;
        }
        // Prefer the rear-facing camera on mobile
        const device =
          devices.find((d) => /back|rear|environment/i.test(d.label)) ??
          devices[devices.length - 1];

        return reader
          .decodeFromVideoDevice(device.deviceId, videoRef.current!, (result, err, controls) => {
            if (!controlsRef.current) {
              controlsRef.current = controls;
              setReady(true);
            }
            if (result && !scannedRef.current) {
              scannedRef.current = true;
              controls.stop();
              onScan(result.getText());
              onClose();
            }
            if (err && !(err instanceof NotFoundException)) {
              setError("Camera error: " + err.message);
            }
          })
          .then((controls) => {
            controlsRef.current = controls;
            setReady(true);
          });
      })
      .catch((e: Error) => {
        if (e.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access in your browser settings.");
        } else {
          setError("Could not start camera: " + e.message);
        }
      });

    return () => {
      controlsRef.current?.stop();
    };
  }, [onScan, onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <p style={{ color: "#fff", marginBottom: 12, fontSize: 15, fontWeight: 500 }}>
        Scan Barcode
      </p>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          borderRadius: 12,
          overflow: "hidden",
          background: "#000",
          minHeight: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <video
          ref={videoRef}
          style={{ width: "100%", display: "block" }}
          muted
          playsInline
        />

        {/* Targeting overlay */}
        {ready && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            {/* Corner marks */}
            {[
              { top: "20%", left: "15%", borderTop: "3px solid #fff", borderLeft: "3px solid #fff", borderRadius: "4px 0 0 0" },
              { top: "20%", right: "15%", borderTop: "3px solid #fff", borderRight: "3px solid #fff", borderRadius: "0 4px 0 0" },
              { bottom: "20%", left: "15%", borderBottom: "3px solid #fff", borderLeft: "3px solid #fff", borderRadius: "0 0 0 4px" },
              { bottom: "20%", right: "15%", borderBottom: "3px solid #fff", borderRight: "3px solid #fff", borderRadius: "0 0 4px 0" },
            ].map((style, i) => (
              <div key={i} style={{ position: "absolute", width: 24, height: 24, ...style }} />
            ))}
            {/* Scan line */}
            <div
              style={{
                position: "absolute",
                left: "15%",
                right: "15%",
                top: "50%",
                height: 2,
                background: "rgba(255, 80, 60, 0.85)",
                boxShadow: "0 0 6px rgba(255,80,60,0.6)",
              }}
            />
          </div>
        )}

        {!ready && !error && (
          <div style={{ position: "absolute", color: "#aaa", fontSize: 14 }}>
            Starting camera…
          </div>
        )}
      </div>

      {error ? (
        <p style={{ color: "#ff6b6b", marginTop: 16, fontSize: 14, textAlign: "center", maxWidth: 360 }}>
          {error}
        </p>
      ) : (
        <p style={{ color: "#bbb", marginTop: 12, fontSize: 13 }}>
          Point the barcode at the camera
        </p>
      )}

      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: 20,
          padding: "10px 32px",
          background: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 500,
          cursor: "pointer",
          letterSpacing: 0.2,
        }}
      >
        Cancel
      </button>
    </div>
  );
};
