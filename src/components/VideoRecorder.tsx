import { useState, useRef, useCallback, useEffect } from 'react';
import { Video, Square, Circle, Check, X, Camera } from 'lucide-react';

interface VideoRecorderProps {
  onSave: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

const MAX_DURATION = 30; // seconds

export default function VideoRecorder({ onSave, onCancel }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setError('Unable to access camera. Please grant camera permissions and try again.');
      console.error(err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp8,opus',
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setIsPreview(true);

      // Show preview
      const url = URL.createObjectURL(blob);
      if (previewRef.current) {
        previewRef.current.src = url;
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
    setIsRecording(true);
    setDuration(0);

    // Timer
    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setDuration(elapsed);
      if (elapsed >= MAX_DURATION) {
        stopRecording();
      }
    }, 100);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const handleSave = () => {
    if (recordedBlob) {
      onSave(recordedBlob, duration);
    }
  };

  const handleDiscard = () => {
    setRecordedBlob(null);
    setIsPreview(false);
    setDuration(0);
    startCamera();
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const progressPercent = (duration / MAX_DURATION) * 100;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full max-w-lg aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-white p-6 text-center">
            <Video className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-red-300">{error}</p>
          </div>
        ) : isPreview && recordedBlob ? (
          <video
            ref={previewRef}
            controls
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-sm font-mono">
              {Math.floor(duration)}s / {MAX_DURATION}s
            </span>
          </div>
        )}

        {/* Progress bar */}
        {isRecording && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
            <div
              className="h-full bg-red-500 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {!isPreview ? (
          <>
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={!cameraActive}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white rounded-full font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <Circle className="w-5 h-5" fill="white" />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-full font-medium transition-all shadow-lg"
              >
                <Square className="w-5 h-5" fill="white" />
                Stop
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-all shadow-lg"
            >
              <Check className="w-5 h-5" />
              Save to Vault
            </button>
            <button
              onClick={handleDiscard}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-medium transition-all shadow-lg"
            >
              <Camera className="w-5 h-5" />
              Re-record
            </button>
          </>
        )}
        <button
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="flex items-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-medium transition-all"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
      </div>

      {isPreview && (
        <p className="text-sm text-gray-500">
          Duration: {Math.floor(duration)}s | Preview your recording before saving
        </p>
      )}
    </div>
  );
}
