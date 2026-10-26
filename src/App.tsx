import { useState, useEffect, useCallback } from 'react';
import { Camera, Upload, FolderOpen, Cloud, Shield, Zap } from 'lucide-react';
import VideoRecorder from './components/VideoRecorder';
import VideoUpload from './components/VideoUpload';
import VideoRepository from './components/VideoRepository';
import { VideoClip, saveVideoClip, getAllClips, generateThumbnail } from './utils/db';
import { v4 as uuidv4 } from 'uuid';

type View = 'home' | 'record' | 'upload' | 'repository';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadClips = useCallback(async () => {
    const allClips = await getAllClips();
    setClips(allClips);
  }, []);

  useEffect(() => {
    loadClips();
  }, [loadClips]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRecordedSave = async (blob: Blob, duration: number) => {
    try {
      const thumbnail = await generateThumbnail(blob);
      const clip: VideoClip = {
        id: uuidv4(),
        name: `recording-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.webm`,
        blob,
        thumbnail,
        duration,
        createdAt: Date.now(),
        source: 'recorded',
        size: blob.size,
      };
      await saveVideoClip(clip);
      await loadClips();
      setCurrentView('repository');
      showNotification('Video saved to vault!', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Failed to save video', 'error');
    }
  };

  const handleUploadSave = async (blob: Blob, name: string, duration: number) => {
    try {
      const thumbnail = await generateThumbnail(blob);
      const clip: VideoClip = {
        id: uuidv4(),
        name,
        blob,
        thumbnail,
        duration,
        createdAt: Date.now(),
        source: 'uploaded',
        size: blob.size,
      };
      await saveVideoClip(clip);
      await loadClips();
      setCurrentView('repository');
      showNotification('Video uploaded to vault!', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Failed to upload video', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] px-6 py-3 rounded-xl shadow-lg text-white font-medium animate-bounce ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ClipVault
              </span>
            </button>

            <nav className="flex items-center gap-1">
              <button
                onClick={() => setCurrentView('record')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'record'
                    ? 'bg-red-50 text-red-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Record</span>
              </button>
              <button
                onClick={() => setCurrentView('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'upload'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
              </button>
              <button
                onClick={() => setCurrentView('repository')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'repository'
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Vault</span>
                {clips.length > 0 && (
                  <span className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded-full">
                    {clips.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'home' && (
          <div className="flex flex-col items-center">
            {/* Hero */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Cloud className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                Clip<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Vault</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Your centralized cloud repository for 30-second video clips. Record or upload, and everything is saved in one place.
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mb-16">
              <button
                onClick={() => setCurrentView('record')}
                className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all text-left"
              >
                <div className="w-14 h-14 bg-red-50 group-hover:bg-red-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Camera className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Record Video</h3>
                <p className="text-sm text-gray-500">
                  Use your camera to record a clip up to 30 seconds. Instant capture with preview.
                </p>
              </button>

              <button
                onClick={() => setCurrentView('upload')}
                className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all text-left"
              >
                <div className="w-14 h-14 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Upload className="w-7 h-7 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Video</h3>
                <p className="text-sm text-gray-500">
                  Upload an existing video file from your device. Drag & drop supported.
                </p>
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <h4 className="font-medium text-gray-800 mb-1">Secure Storage</h4>
                <p className="text-sm text-gray-500">Videos stored locally in your browser with IndexedDB</p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5 text-purple-500" />
                </div>
                <h4 className="font-medium text-gray-800 mb-1">Instant Save</h4>
                <p className="text-sm text-gray-500">Record and save in seconds, no waiting</p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
                  <FolderOpen className="w-5 h-5 text-orange-500" />
                </div>
                <h4 className="font-medium text-gray-800 mb-1">Organized Vault</h4>
                <p className="text-sm text-gray-500">All clips in one place with search & download</p>
              </div>
            </div>

            {/* Recent clips preview */}
            {clips.length > 0 && (
              <div className="w-full max-w-3xl mt-16">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Recent Clips</h2>
                  <button
                    onClick={() => setCurrentView('repository')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all →
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {clips.slice(0, 4).map((clip) => (
                    <div
                      key={clip.id}
                      onClick={() => setCurrentView('repository')}
                      className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                    >
                      {clip.thumbnail ? (
                        <img src={clip.thumbnail} alt={clip.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        {Math.floor(clip.duration)}s
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'record' && (
          <div className="flex flex-col items-center">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Record a Clip</h2>
              <p className="text-gray-500">Capture up to 30 seconds of video from your camera</p>
            </div>
            <VideoRecorder
              onSave={handleRecordedSave}
              onCancel={() => setCurrentView('home')}
            />
          </div>
        )}

        {currentView === 'upload' && (
          <div className="flex flex-col items-center">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload a Clip</h2>
              <p className="text-gray-500">Add an existing video file to your vault (max 30 seconds)</p>
            </div>
            <VideoUpload
              onSave={handleUploadSave}
              onCancel={() => setCurrentView('home')}
            />
          </div>
        )}

        {currentView === 'repository' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Video Vault</h2>
                <p className="text-gray-500 text-sm">Your centralized clip repository</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('record')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Record New
                </button>
                <button
                  onClick={() => setCurrentView('upload')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </div>
            </div>
            <VideoRepository clips={clips} onClipsChange={loadClips} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-gray-400 border-t border-gray-100">
        <p>ClipVault • Centralized Video Repository • Videos stored locally in your browser</p>
      </footer>
    </div>
  );
}

export default App;
