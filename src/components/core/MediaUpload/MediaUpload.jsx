import { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { uploadMedia, validateMedia, detectMediaCategory, MEDIA_RULES } from '../../../services/mediaService';

/**
 * MediaUpload — reusable file selection, validation, progress, and preview component.
 *
 * Props:
 *  onUploadComplete(mediaArray) — called when triggerUpload() resolves
 *  maxFiles           — max number of files (default 3)
 *  accept             — file input accept string (default "image/*,video/*,audio/*")
 *  label              — optional field label
 *  className          — wrapper class override
 *
 * Ref API:
 *  ref.triggerUpload() — call from form's onSubmit; returns Promise<mediaArray>
 */
const MediaUpload = forwardRef(({
  onUploadComplete,
  maxFiles = 3,
  accept = 'image/*,video/*,audio/*',
  label,
  className = '',
}, ref) => {
  const fileInputRef = useRef(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  /* ── Imperative handle ─────────────────────────────────────────────────── */
  useImperativeHandle(ref, () => ({ triggerUpload }));

  /* ── File Handling ─────────────────────────────────────────────────────── */

  const addFiles = (incomingFiles) => {
    setGlobalError('');
    const fileArray = Array.from(incomingFiles);
    const remaining = maxFiles - pendingFiles.length;
    if (remaining <= 0) {
      setGlobalError(`You can attach up to ${maxFiles} files per post.`);
      return;
    }
    const toAdd = fileArray.slice(0, remaining);

    const newEntries = toAdd.map((file) => {
      const validation = validateMedia(file);
      const category = detectMediaCategory(file);
      const preview = category === 'image' ? URL.createObjectURL(file) : null;
      return { file, preview, category, error: validation.error };
    });

    setPendingFiles((prev) => [...prev, ...newEntries]);

    if (fileArray.length > remaining) {
      setGlobalError(`Only ${maxFiles} files allowed. ${fileArray.length - remaining} file(s) were ignored.`);
    }
  };

  const removeFile = (idx) => {
    setPendingFiles((prev) => {
      const next = [...prev];
      if (next[idx]?.preview) URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  };

  /* ── Drag & Drop ───────────────────────────────────────────────────────── */

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  /* ── Upload ────────────────────────────────────────────────────────────── */

  const triggerUpload = async () => {
    const validEntries = pendingFiles.filter((e) => !e.error);
    if (validEntries.length === 0) {
      onUploadComplete?.([]);
      return [];
    }

    setUploading(true);
    setGlobalError('');
    const results = [];

    for (let i = 0; i < validEntries.length; i++) {
      const entry = validEntries[i];
      const key = entry.file.name + '_' + i;
      try {
        const result = await uploadMedia(entry.file, (pct) => {
          setUploadProgress((prev) => ({ ...prev, [key]: pct }));
        });
        results.push(result);
        setUploadProgress((prev) => ({ ...prev, [key]: 100 }));
      } catch (err) {
        setGlobalError(`Failed to upload "${entry.file.name}": ${err.message}`);
        setUploading(false);
        return [];
      }
    }

    setUploading(false);
    onUploadComplete?.(results);
    return results;
  };

  /* ── Helpers ───────────────────────────────────────────────────────────── */

  const hasInvalidFiles = pendingFiles.some((e) => e.error);
  const formatBytes = (b) => b >= 1024 * 1024
    ? `${(b / (1024 * 1024)).toFixed(0)}MB`
    : `${(b / 1024).toFixed(0)}KB`;

  const CategoryIcon = ({ category }) => {
    if (category === 'image') return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
    if (category === 'video') return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </svg>
    );
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    );
  };

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-800">{label}</label>
      )}

      {/* Drop Zone */}
      {pendingFiles.length < maxFiles && (
        <div
          className={`
            relative min-h-[140px] rounded-2xl cursor-pointer
            flex flex-col items-center justify-center gap-3 text-center
            border-2 border-dashed transition-all duration-200 p-6
            ${dragActive ? 'border-[#00B8D4] bg-[#E0F7FA]' : 'border-[#00E5FF] bg-[#F0FEFF] hover:bg-[#E0F7FA]'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
            className="absolute w-px h-px p-0 -m-px overflow-hidden border-0"
            style={{ clip: 'rect(0,0,0,0)' }}
          />
          <svg className="w-10 h-10 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div>
            <span className="text-sm text-gray-600">
              <span className="text-[#00E5FF] font-semibold">Click to upload</span> or drag and drop
            </span>
            <p className="text-xs text-gray-400 mt-1">
              {MEDIA_RULES.image.label} · {MEDIA_RULES.video.label} · {MEDIA_RULES.audio.label}
            </p>
            <p className="text-xs text-gray-400">Up to {maxFiles} file{maxFiles > 1 ? 's' : ''} per post</p>
          </div>
        </div>
      )}

      {/* Global error */}
      {globalError && (
        <p className="text-xs text-red-500 px-1">{globalError}</p>
      )}

      {/* File Previews */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          {pendingFiles.map((entry, idx) => {
            const key = entry.file.name + '_' + idx;
            const progress = uploadProgress[key] ?? 0;
            const isUploading = uploading && !entry.error;

            return (
              <div
                key={key}
                className={`
                  rounded-xl border overflow-hidden
                  ${entry.error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}
                `}
              >
                {/* Image preview */}
                {entry.category === 'image' && entry.preview && !entry.error && (
                  <div className="relative">
                    <img
                      src={entry.preview}
                      alt={entry.file.name}
                      className="w-full max-h-[200px] object-cover block"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}

                {/* File meta row */}
                <div className="flex items-center gap-3 p-3">
                  <span className={`flex-shrink-0 ${entry.category === 'image' ? 'text-blue-500' : entry.category === 'video' ? 'text-purple-500' : 'text-green-500'}`}>
                    <CategoryIcon category={entry.category ?? 'image'} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{entry.file.name}</p>
                    <p className="text-xs text-gray-400">{formatBytes(entry.file.size)}</p>
                    {entry.error && (
                      <p className="text-xs text-red-500 mt-0.5">{entry.error}</p>
                    )}
                    {isUploading && (
                      <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-[#00B8D4] to-[#00E5FF] transition-all duration-200"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                    {isUploading && (
                      <p className="text-xs text-[#00B8D4] mt-0.5">{progress}% uploaded</p>
                    )}
                  </div>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="flex-shrink-0 p-1.5 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove file"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload-on-submit note */}
      {pendingFiles.length > 0 && !uploading && (
        <p className="text-xs text-gray-400 text-center">
          {hasInvalidFiles
            ? 'Fix the errors above before submitting.'
            : `${pendingFiles.filter(e => !e.error).length} file(s) will upload when you submit.`}
        </p>
      )}
    </div>
  );
});

MediaUpload.displayName = 'MediaUpload';

export default MediaUpload;

/**
 * Helper hook for forms:
 * Creates a ref-like object to call triggerUpload from a parent form's onSubmit.
 *
 * Usage:
 *   const mediaRef = useMediaUploadRef();
 *   <MediaUpload ref={mediaRef} ... />
 *   const mediaArray = await mediaRef.current.upload();
 */
export const createMediaUploadController = () => {
  let _triggerFn = null;
  return {
    register: (fn) => { _triggerFn = fn; },
    upload: async () => {
      if (typeof _triggerFn === 'function') return _triggerFn();
      return [];
    },
  };
};
