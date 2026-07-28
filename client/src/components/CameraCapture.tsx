import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Video, VideoOff, SwitchCamera } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  disabled: boolean;
}

type FacingMode = "environment" | "user";

export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startCamera(mode: FacingMode = facingMode) {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access isn't available in this browser. Use \"Upload photo\" instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setError("Couldn't access the camera. Check permissions, or use \"Upload photo\" instead.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  function flipCamera() {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL("image/jpeg", 0.9));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onCapture(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="camera-capture">
      <div className={`camera-viewport ${cameraOn ? "" : "camera-viewport-empty"}`}>
        <video ref={videoRef} playsInline muted className={cameraOn ? "" : "hidden"} />
        {!cameraOn && (
          <p className="camera-placeholder">
            <Camera size={28} style={{ display: "block", margin: "0 auto 10px", opacity: 0.6 }} />
            Camera preview will appear here
          </p>
        )}
        {cameraOn && (
          <>
            <div className="scan-frame">
              <span className="corner-tl" />
              <span className="corner-tr" />
              <span className="corner-bl" />
              <span className="corner-br" />
            </div>
            <span className="scan-hint">Center the item in frame</span>
            <button
              type="button"
              className="camera-flip-btn"
              onClick={flipCamera}
              disabled={disabled}
              aria-label="Flip camera"
              title="Flip camera"
            >
              <SwitchCamera size={18} />
            </button>
          </>
        )}
      </div>

      {error && <p className="camera-error">{error}</p>}

      <div className="camera-controls">
        {!cameraOn ? (
          <button type="button" className="btn btn-primary" onClick={() => startCamera()} disabled={disabled}>
            <Video size={17} />
            Start camera
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={captureFrame} disabled={disabled}>
              <Camera size={17} />
              Capture
            </button>
            <button type="button" className="btn btn-secondary" onClick={stopCamera} disabled={disabled}>
              <VideoOff size={17} />
              Stop
            </button>
          </>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <ImageUp size={17} />
          Upload photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
