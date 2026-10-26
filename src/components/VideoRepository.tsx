import { useState, useRef, useEffect } from 'react';
import { Play, Trash2, Download, Clock, HardDrive, Film, Search } from 'lucide-react';
import { VideoClip, deleteClip } from '../utils/db';

interface VideoRepositoryProps {
  clips: VideoClip[];
  onClipsChange: () => void;
}

export default function VideoRepository({ clips, onClipsChange }: VideoRepositoryProps) {
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  const filteredClips = clips.filter(clip =>
    clip.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = clips.reduce((acc, clip) => acc + clip.size, 0);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async (id: string) => {
    await deleteClip(id);
    setDeleteConfirm(null);
    onClipsChange();
  };

  const handleDownload = (clip: VideoClip) => {
    const url = URL.createObjectURL(clip.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = clip.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openModal = (clip: VideoClip) => {
    setSelectedClip(clip);
  };

  const closeModal = () => {
    setSelectedClip(null);
  };

  useEffect(() => {
    if (selectedClip && modalVideoRef.current) {
      const url = URL.createObjectURL(selectedClip.blob);
      modalVideoRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [selectedClip]);

  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Film className="w-20 h-20 mb-4 opacity-50" />
        <p className="text-xl font-medium">Your vault is empty</p>
        <p className="text-sm mt-2">Record or upload a video clip to get started</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">
            {clips.length} clip{clips.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-purple-500" />
          <span className="text-sm font-medium text-gray-700">
            {formatSize(totalSize)} total
          </span>
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredClips.map((clip) => (
          <div
            key={clip.id}
            className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100"
          >
            {/* Thumbnail */}
            <div
              className="relative aspect-video bg-gray-100 cursor-pointer"
              onClick={() => openModal(clip)}
            >
              {clip.thumbnail ? (
                <img
                  src={clip.thumbnail}
                  alt={clip.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="w-10 h-10 text-gray-300" />
                </div>
              )}
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                  <Play className="w-5 h-5 text-gray-800 ml-0.5" fill="currentColor" />
                </div>
              </div>
              {/* Duration badge */}
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                {Math.floor(clip.duration)}s
              </div>
              {/* Source badge */}
              <div className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                clip.source === 'recorded'
                  ? 'bg-red-500/90 text-white'
                  : 'bg-blue-500/90 text-white'
              }`}>
                {clip.source === 'recorded' ? '🎥 Recorded' : '📁 Uploaded'}
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="text-sm font-medium text-gray-800 truncate" title={clip.name}>
                {clip.name}
              </p>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(clip.createdAt)}</span>
                <span className="ml-auto">{formatSize(clip.size)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(clip);
                }}
                className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm"
                title="Download"
              >
                <Download className="w-4 h-4 text-gray-700" />
              </button>
              {deleteConfirm === clip.id ? (
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(clip.id);
                    }}
                    className="p-1.5 bg-red-500 hover:bg-red-600 rounded-full shadow-sm"
                    title="Confirm delete"
                  >
                    <span className="text-white text-xs font-bold">✓</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(null);
                    }}
                    className="p-1.5 bg-gray-500 hover:bg-gray-600 rounded-full shadow-sm"
                    title="Cancel"
                  >
                    <span className="text-white text-xs font-bold">✕</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(clip.id);
                  }}
                  className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedClip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-black">
              <video
                ref={modalVideoRef}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{selectedClip.name}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(selectedClip.createdAt)} • {Math.floor(selectedClip.duration)}s • {formatSize(selectedClip.size)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(selectedClip)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
