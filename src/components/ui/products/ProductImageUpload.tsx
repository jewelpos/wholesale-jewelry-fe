"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Plus, X } from "react-feather";

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files].slice(0, maxImages);
    onChange(newImages);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleOpenCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      alert("Unable to access camera.");
      setShowCamera(false);
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
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
      // Convert dataUrl to File
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

  const handleBackdropClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (e.target === e.currentTarget) {
      handleCloseCamera();
    }
  };

  return (
    <>
      <div className="mb-3">
        <label className="form-label">Images</label>
        <div className="row g-3">
          {/* Add Images Button */}
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
                onClick={handleAddClick}
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

          {/* Image Previews */}
          {images.map((image, index) => (
            <div key={index} className="col-auto position-relative">
              <div
                className="product-image-preview"
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
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Camera Capture Button */}
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
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          onClick={handleBackdropClick}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Capture Product Photo</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleCloseCamera}
                ></button>
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
                  className="btn btn-success me-2"
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

export default ProductImageUpload;
