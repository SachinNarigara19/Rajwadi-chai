import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Check,
  SwitchCamera,
  AlertCircle,
  Upload,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (imageUrl: string) => void;
  productName?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  productName,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [flashAnimation, setFlashAnimation] = useState(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Check if multiple camera devices exist
  const checkDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      }
    } catch (e) {
      // Ignore device enumeration errors
    }
  };

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMsg(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Camera access is not supported in this browser. Please use file upload.');
      return;
    }

    try {
      // Attempt with ideal resolution and selected facing mode
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
          setIsStreaming(true);
        };
      }
      checkDevices();
    } catch (err: any) {
      console.warn('Initial camera constraint failed, retrying with basic video constraint:', err);
      try {
        // Fallback to basic video constraint
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error);
            setIsStreaming(true);
          };
        }
      } catch (fallbackErr: any) {
        console.error('Camera access completely denied or failed:', fallbackErr);
        setErrorMsg(
          fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError'
            ? 'Camera permission was denied. Please allow camera permissions in your browser or use the file upload option below.'
            : 'Could not connect to camera device. Ensure no other application is using the camera.'
        );
      }
    }
  }, [facingMode, stopCamera]);

  // Mount/Unmount effect
  useEffect(() => {
    if (isOpen) {
      setCapturedDataUrl(null);
      setErrorMsg(null);
      startCamera();
    } else {
      stopCamera();
      setCapturedDataUrl(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Toggle front/back camera
  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture snapshot from video stream onto canvas
  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Use intrinsic video dimensions
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, flip horizontally for natural mirror look
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // Reset transform
    if (facingMode === 'user') {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Trigger visual flash animation
    setFlashAnimation(true);
    setTimeout(() => setFlashAnimation(false), 200);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedDataUrl(dataUrl);

    // Stop live stream while reviewing photo
    stopCamera();
  };

  // Retake photo: discard captured snapshot and restart live camera stream
  const handleRetake = () => {
    setCapturedDataUrl(null);
    startCamera();
  };

  // Upload photo to backend
  const handleAcceptPhoto = async () => {
    if (!capturedDataUrl) return;

    setIsUploading(true);
    setErrorMsg(null);

    try {
      // Send base64 to /upload-camera-photo
      const res = await api.post<{ success: boolean; imageUrl: string }>('/products/upload-camera-photo', {
        imageBase64: capturedDataUrl,
      });

      if (res.success && res.imageUrl) {
        onPhotoCaptured(res.imageUrl);
        onClose();
      } else {
        throw new Error('Upload response did not return an image URL.');
      }
    } catch (err: any) {
      console.error('Failed to upload captured camera photo:', err);
      // Fallback: try multipart blob upload to /upload-image
      try {
        if (!canvasRef.current) throw new Error('Canvas unavailable');
        canvasRef.current.toBlob(async (blob) => {
          if (!blob) throw new Error('Blob creation failed');
          const formData = new FormData();
          formData.append('image', blob, 'camera-capture.jpg');
          const fallbackRes = await api.post<{ success: boolean; imageUrl: string }>('/products/upload-image', formData);
          if (fallbackRes.success && fallbackRes.imageUrl) {
            onPhotoCaptured(fallbackRes.imageUrl);
            onClose();
          } else {
            setErrorMsg('Failed to save captured photo. Please try again.');
          }
        }, 'image/jpeg', 0.9);
      } catch (secondErr: any) {
        setErrorMsg('Failed to upload captured photo. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Mobile/device native camera fallback file picker
  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCapturedDataUrl(reader.result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                Take Product Photo
                <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Live Camera
                </span>
              </h3>
              <p className="text-[11px] text-stone-400 truncate max-w-xs">
                {productName ? `Item: ${productName}` : 'Capture a crisp product snapshot'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasMultipleCameras && !capturedDataUrl && (
              <button
                type="button"
                onClick={handleToggleCamera}
                title="Switch Camera (Front / Back)"
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder / Preview Area */}
        <div className="relative aspect-4/3 w-full bg-black flex items-center justify-center overflow-hidden">
          {/* Shutter flash animation overlay */}
          {flashAnimation && (
            <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200 pointer-events-none" />
          )}

          {/* Captured Image Preview */}
          {capturedDataUrl ? (
            <div className="relative w-full h-full flex items-center justify-center bg-stone-950">
              <img
                src={capturedDataUrl}
                alt="Captured Snapshot"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Photo Captured
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <div className="relative w-full h-full flex items-center justify-center bg-stone-950">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              />

              {/* Viewfinder Alignment Overlay */}
              {isStreaming && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  {/* Outer dimmed border */}
                  <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-dashed border-amber-400/70 rounded-3xl flex items-center justify-center shadow-lg">
                    {/* Corner targeting brackets */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />

                    <div className="bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-semibold text-amber-200 border border-amber-400/30">
                      Center Product Here
                    </div>
                  </div>
                </div>
              )}

              {/* Camera loading state */}
              {!isStreaming && !errorMsg && (
                <div className="text-center space-y-3 p-4">
                  <div className="w-9 h-9 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-stone-400 font-medium">Accessing device camera...</p>
                </div>
              )}

              {/* Error fallback state */}
              {errorMsg && (
                <div className="p-6 text-center max-w-sm space-y-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-stone-300 font-medium leading-relaxed">{errorMsg}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Take / Choose from Device</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hidden Canvas for High-Resolution Capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden Native Camera File Input Fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleNativeFileChange}
            className="hidden"
          />
        </div>

        {/* Footer Controls */}
        <div className="p-4 sm:p-5 bg-stone-900 border-t border-stone-800">
          {capturedDataUrl ? (
            /* Review Controls */
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                disabled={isUploading}
                className="flex-1 inline-flex items-center justify-center space-x-2 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-200 text-xs font-semibold py-3 px-4 rounded-xl border border-stone-700 transition"
              >
                <RefreshCw className="w-4 h-4 text-stone-400" />
                <span>Retake Photo</span>
              </button>

              <button
                type="button"
                onClick={handleAcceptPhoto}
                disabled={isUploading}
                className="flex-1 inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-950/50 transition disabled:opacity-60"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Use This Photo</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Live Camera Controls */
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center space-x-1.5 text-stone-400 hover:text-stone-200 text-xs py-2 px-3 rounded-xl hover:bg-stone-800/80 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Device Picker</span>
              </button>

              {/* Shutter Button */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  disabled={!isStreaming}
                  className="group relative flex items-center justify-center w-16 h-16 rounded-full border-4 border-stone-600 hover:border-amber-400 active:scale-95 transition-all shadow-xl disabled:opacity-30 disabled:pointer-events-none"
                  title="Click to capture photo"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500 group-hover:bg-amber-400 group-active:scale-90 transition-transform shadow-inner flex items-center justify-center text-stone-900">
                    <Camera className="w-5 h-5 text-stone-950" />
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-stone-400 hover:text-stone-200 text-xs py-2 px-3 rounded-xl hover:bg-stone-800/80 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
