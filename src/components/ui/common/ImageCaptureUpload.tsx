import React, { useState, useRef } from "react";
import Image from "next/image";
import { PlusCircle } from "react-feather";

interface ImageCaptureUploadProps {
  value?: File | null;
  onChange: (value: File | null) => void;
  label?: string;
  disabled?: boolean;
}

const ImageCaptureUpload: React.FC<ImageCaptureUploadProps> = ({
  value,
  onChange,
  label = "Upload or Capture Photo",
  disabled = false,
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    value instanceof File ? URL.createObjectURL(value) : null
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      onChange(file);
    }
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
          const file = new File([buf], "captured-image.png", {
            type: "image/png",
          });
          setImagePreview(URL.createObjectURL(file));
          onChange(file);
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
      <div className="profile-pic-upload text-center">
        <div className="profile-pic">
          {!imagePreview && (
            <span>
              <PlusCircle className="plus-down-add" />
              Profile Photo
            </span>
          )}
          {imagePreview && (
            <Image
              src={imagePreview}
              unoptimized
              alt="Preview"
              width={100}
              height={100}
            />
          )}
        </div>
        {!disabled && (
          <div className="input-blocks mb-0">
            <div className="image-upload mb-2">
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <div className="image-uploads">
                <h4>Upload</h4>
              </div>
            </div>
            <div className="image-upload mb-0">
              <div
                className="image-uploads"
                tabIndex={1}
                onClick={handleOpenCamera}
                style={{ cursor: "pointer" }}
              >
                <h4>Capture</h4>
              </div>
            </div>
          </div>
        )}
      </div>
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
                <h5 className="modal-title">Capture Photo</h5>
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

export default ImageCaptureUpload;
