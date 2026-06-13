"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Camera, User, ImagePlus, Video } from "lucide-react";

interface AvatarUploadProps {
  value?: File | string | null;
  onChange: (value: File | null) => void;
  name?: string;
  disabled?: boolean;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  value,
  onChange,
  name,
  disabled = false,
}) => {
  const [preview, setPreview] = useState<string | null>(
    typeof value === "string" && value
      ? value
      : value instanceof File
      ? URL.createObjectURL(value)
      : null
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onChange(file);
    }
    setDropdownOpen(false);
    e.target.value = "";
  };

  const handleOpenCamera = async () => {
    setDropdownOpen(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch {
      alert("Unable to access camera.");
      setShowCamera(false);
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    fetch(canvas.toDataURL("image/png"))
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        const file = new File([buf], "captured.png", { type: "image/png" });
        setPreview(URL.createObjectURL(file));
        onChange(file);
      });
    handleCloseCamera();
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "12px 0 8px",
          gap: 10,
        }}
      >
        {/* Avatar circle */}
        <div style={{ position: "relative", display: "inline-block" }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: preview ? "transparent" : "#f1f3f5",
              border: "2.5px solid #dee2e6",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {preview ? (
              <Image
                src={preview}
                alt="Avatar"
                width={88}
                height={88}
                unoptimized
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            ) : (
              <User size={36} color="#ced4da" strokeWidth={1.5} />
            )}
          </div>

          {/* Camera button + dropdown */}
          {!disabled && (
            <div ref={dropdownRef} style={{ position: "absolute", bottom: 2, right: 2 }}>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                style={{
                  width: 27,
                  height: 27,
                  borderRadius: "50%",
                  background: "#0d6efd",
                  border: "2.5px solid #fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 1px 5px rgba(0,0,0,0.22)",
                  padding: 0,
                }}
              >
                <Camera size={13} color="#fff" strokeWidth={2.2} />
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 32,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #e9ecef",
                    borderRadius: 8,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.13)",
                    minWidth: 156,
                    overflow: "hidden",
                    zIndex: 200,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      width: "100%",
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      fontSize: 13,
                      color: "#343a40",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f8f9fa")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                    <ImagePlus size={14} color="#6c757d" />
                    Upload Photo
                  </button>
                  <div style={{ height: 1, background: "#f1f3f5", margin: "0 10px" }} />
                  <button
                    type="button"
                    onClick={handleOpenCamera}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      width: "100%",
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      fontSize: 13,
                      color: "#343a40",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f8f9fa")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                    <Video size={14} color="#6c757d" />
                    Take Photo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Name + subtitle */}
        <div style={{ textAlign: "center", lineHeight: 1.3 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#343a40" }}>
            {name?.trim() || "New Customer"}
          </div>
          <div style={{ fontSize: 11, color: "#adb5bd", marginTop: 2 }}>
            Customer
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {/* Camera modal */}
      {showCamera && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseCamera();
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Take Photo</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseCamera}
                />
              </div>
              <div className="modal-body text-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  width={320}
                  height={240}
                  style={{ borderRadius: 8, background: "#222" }}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary me-2"
                  onClick={handleCapture}
                >
                  Capture
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseCamera}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarUpload;
