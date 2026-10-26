import { useState, useRef } from 'react';
import { Upload, FileVideo, X, Check, AlertCircle } from 'lucide-react';

interface VideoUploadProps {
  onSave: (blob: Blob, name: string, duration: number) => void;
  onCancel: () => void;
}

const MAX_DURATION = 30; // seconds

export default function VideoUpload({ onSave, onCancel }: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);

    // Validate file type
    if (!selectedFile.type.startsWith('video/')) {
      setError('Please select a valid video file (MP4, WebM, MOV, etc.)');
      return;
    }

    // Validate file size (max 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File is too large. Maximum size is 50MB.');
      return;
    }

    setFile(selectedFile);

    // Create preview
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);

    // Get duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      setDuration(video.duration);
      if (video.duration > MAX_DURATION + 2) { // Allow 2s tolerance
        setError(`Video is ${Math.floor(video.duration)}s long. Maximum is ${MAX_DURATION} seconds.`);
      }
      URL.revokeObjectURL(url);
    };
    video.src = url;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleSave = () => {
    if (file) {
      onSave(file, file.name, duration);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setDuration(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg">
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <Upload className={`w-16 h-16 mb-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-lg font-medium text-gray-600">
            Drop your video here or click to browse
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Supports MP4, WebM, MOV • Max {MAX_DURATION}s • Max 50MB
          </p>
        </div>
      ) : (
        <div className="w-full">
          <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
            <video
              src={preview || ''}
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-lg w-full">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {file && (
        <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-3 w-full">
          <FileVideo className="w-8 h-8 text-blue-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)} • {Math.floor(duration)}s
            </p>
          </div>
          <button
            onClick={handleClear}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => {
          const selectedFile = e.target.files?.[0];
          if (selectedFile) handleFileSelect(selectedFile);
        }}
        className="hidden"
      />

      <div className="flex items-center gap-4">
        {file && !error && (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-all shadow-lg"
          >
            <Check className="w-5 h-5" />
            Save to Vault
          </button>
        )}
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-medium transition-all"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
      </div>
    </div>
  );
}
