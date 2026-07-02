"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Plus, X, RefreshCw } from "react-feather";

interface ProductImageUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  images,
  onChange,
  maxImages = 10,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera device selection
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [cameraMode, setCameraMode] = useState<"usb" | "ip">("usb");

  // IP camera
  const [ipCameraUrl, setIpCameraUrl] = useState("");
  const [ipPreviewSrc, setIpPreviewSrc] = useState("");
  const [ipLoading, setIpLoading] = useState(false);
  const [ipError, setIpError] = useState("");

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const openStream = useCallback(async (deviceId?: string) => {
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch {
      alert("Unable to access camera. Please allow camera permissions or select a different device.");
    }
  }, []);

  const enumerateCameras = useCallback(async () => {
    try {
      // Request permission first so labels are populated
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore — labels may still be empty but we'll show deviceId fallback
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === "videoinput");
    setAvailableCameras(videoDevices);
    return videoDevices;
  }, []);

  const handleOpenCamera = async () => {
    setShowCamera(true);
    setCameraMode("usb");
    setIpPreviewSrc("");
    setIpError("");
    const videoDevices = await enumerateCameras();
    const firstId = videoDevices[0]?.deviceId || "";
    setSelectedDeviceId(firstId);
    await openStream(firstId || undefined);
  };

  const handleRefreshCameras = async () => {
    const videoDevices = await enumerateCameras();
    if (videoDevices.length > 0) {
      const firstId = videoDevices[0].deviceId;
      setSelectedDeviceId(firstId);
      await openStream(firstId);
    }
  };

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    await openStream(deviceId);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    stopStream();
    setIpPreviewSrc("");
    setIpError("");
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      fetch(dataUrl)
        .then((res) => res.arrayBuffer())
        .then((buf) => {
          const file = new File([buf], `captured-${Date.now()}.png`, {
            type: "image/png",
          });
          const newImages = [...images, file].slice(0, maxImages);
          onChange(newImages);
        });
    }
    handleCloseCamera();
  };

  // IP Camera handlers
  const handleIpPreview = async () => {
    if (!ipCameraUrl.trim()) return;
    setIpLoading(true);
    setIpError("");
    setIpPreviewSrc("");
    try {
      const proxied = `/api/camera-proxy?url=${encodeURIComponent(ipCameraUrl.trim())}`;
      // Append timestamp to bust cache for live snapshots
      const res = await fetch(`${proxied}&t=${Date.now()}`);
      if (!res.ok) throw new Error(`Camera returned ${res.status}`);
      const blob = await res.blob();
      setIpPreviewSrc(URL.createObjectURL(blob));
    } catch (e: any) {
      setIpError(e.message || "Failed to load snapshot. Check the URL and camera connection.");
    } finally {
      setIpLoading(false);
    }
  };

  const handleIpUsePhoto = async () => {
    if (!ipPreviewSrc) return;
    const res = await fetch(ipPreviewSrc);
    const blob = await res.blob();
    const file = new File([blob], `ip-camera-${Date.now()}.jpg`, {
      type: blob.type || "image/jpeg",
    });
    const newImages = [...images, file].slice(0, maxImages);
    onChange(newImages);
    handleCloseCamera();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files].slice(0, maxImages);
    onChange(newImages);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseCamera();
    }
  };

  return (
    <>
      <div className="mb-3">
        <label className="form-label">Images</label>
        <div className="row g-3">
          {images.length < maxImages && !disabled && (
            <div className="col-auto">
              <div
                className="product-image-upload-placeholder d-flex flex-column align-items-center justify-content-center"
                style={{
                  width: "120px",
                  height: "120px",
                  border: "2px dashed #ddd",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: "#f8f9fa",
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={24} className="text-muted mb-2" />
                <span className="text-muted small">Add Images</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>
          )}

          {images.map((image, index) => (
            <div key={index} className="col-auto position-relative">
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid #ddd",
                  position: "relative",
                }}
              >
                <Image
                  src={URL.createObjectURL(image)}
                  alt={`Product image ${index + 1}`}
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
                {!disabled && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm position-absolute"
                    style={{
                      top: "4px",
                      right: "4px",
                      width: "24px",
                      height: "24px",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                    }}
                    onClick={() => onChange(images.filter((_, i) => i !== index))}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {images.length < maxImages && !disabled && (
          <div className="mt-3">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={handleOpenCamera}
            >
              <Plus size={16} className="me-1" />
              Capture Photo
            </button>
          </div>
        )}

        <div className="form-text">
          {images.length} of {maxImages} images uploaded
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          onClick={handleBackdropClick}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Capture Product Photo</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleCloseCamera}
                />
              </div>

              {/* Mode tabs */}
              <div className="modal-body pb-0">
                <ul className="nav nav-tabs mb-3">
                  <li className="nav-item">
                    <button
                      className={`nav-link${cameraMode === "usb" ? " active" : ""}`}
                      type="button"
                      onClick={() => { setCameraMode("usb"); openStream(selectedDeviceId || undefined); }}
                    >
                      USB / Webcam
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link${cameraMode === "ip" ? " active" : ""}`}
                      type="button"
                      onClick={() => { setCameraMode("ip"); stopStream(); }}
                    >
                      IP Camera
                    </button>
                  </li>
                </ul>

                {/* USB mode */}
                {cameraMode === "usb" && (
                  <>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <select
                        className="form-select form-select-sm"
                        value={selectedDeviceId}
                        onChange={(e) => handleDeviceChange(e.target.value)}
                        style={{ maxWidth: 360 }}
                      >
                        {availableCameras.length === 0 && (
                          <option value="">No cameras found</option>
                        )}
                        {availableCameras.map((cam, i) => (
                          <option key={cam.deviceId} value={cam.deviceId}>
                            {cam.label || `Camera ${i + 1}`}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                        onClick={handleRefreshCameras}
                        title="Refresh camera list"
                      >
                        <RefreshCw size={14} />
                        Refresh
                      </button>
                    </div>
                    <div className="text-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{
                          width: "100%",
                          maxWidth: 480,
                          borderRadius: 8,
                          background: "#222",
                          aspectRatio: "4/3",
                        }}
                      />
                    </div>
                  </>
                )}

                {/* IP Camera mode */}
                {cameraMode === "ip" && (
                  <>
                    <div className="mb-2">
                      <label className="form-label small mb-1">
                        Camera Snapshot URL
                        <span className="text-muted ms-1 fw-normal">(e.g. http://192.168.1.50/snapshot.jpg)</span>
                      </label>
                      <div className="input-group input-group-sm">
                        <input
                          type="url"
                          className="form-control"
                          placeholder="http://192.168.x.x/snapshot.jpg"
                          value={ipCameraUrl}
                          onChange={(e) => setIpCameraUrl(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleIpPreview()}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={handleIpPreview}
                          disabled={ipLoading || !ipCameraUrl.trim()}
                        >
                          {ipLoading ? "Loading…" : "Load Preview"}
                        </button>
                      </div>
                    </div>
                    {ipError && (
                      <div className="alert alert-danger py-2 small">{ipError}</div>
                    )}
                    {ipPreviewSrc && (
                      <div className="text-center mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ipPreviewSrc}
                          alt="IP camera snapshot"
                          style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 8, border: "1px solid #ddd" }}
                        />
                      </div>
                    )}
                    {!ipPreviewSrc && !ipError && (
                      <div
                        className="text-center text-muted d-flex align-items-center justify-content-center"
                        style={{ height: 200, background: "#f8f9fa", borderRadius: 8, border: "1px solid #ddd" }}
                      >
                        <span>Enter snapshot URL above and click Load Preview</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="modal-footer">
                {cameraMode === "usb" && (
                  <button
                    type="button"
                    className="btn btn-success me-2"
                    onClick={handleCapture}
                  >
                    Capture
                  </button>
                )}
                {cameraMode === "ip" && (
                  <button
                    type="button"
                    className="btn btn-success me-2"
                    onClick={handleIpUsePhoto}
                    disabled={!ipPreviewSrc}
                  >
                    Use This Photo
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={handleCloseCamera}>
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

export default ProductImageUpload;
