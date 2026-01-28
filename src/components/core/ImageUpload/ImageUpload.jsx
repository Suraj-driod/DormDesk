import { useRef, useState } from 'react';
import { theme } from '../../../theme';

const ImageUpload = ({
  label,
  helperText,
  onChange,
  error,
  required = false,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024,
  className = '',
}) => {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;

    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setFileName(file.name);
      onChange?.(file, e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
    onChange?.(null, null);
  };

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-800">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      
      <div
        className={`
          relative overflow-hidden min-h-[180px] rounded-xl cursor-pointer
          flex items-center justify-center transition-all duration-200
          ${preview 
            ? `p-0 border-2 border-solid border-[#7CF3FF] ${theme.glow}` 
            : `p-8 border-2 border-dashed border-[#00E5FF] bg-[#F0FEFF] hover:bg-[#E0F7FA]`
          }
          ${dragActive ? 'bg-[#E0F7FA] border-[#00B8D4]' : ''}
          ${error ? 'border-red-500' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute w-px h-px p-0 -m-px overflow-hidden border-0"
          style={{ clip: 'rect(0,0,0,0)' }}
          required={required}
        />
        
        {preview ? (
          <div className="w-full h-full relative min-h-[180px]">
            <img src={preview} alt="Preview" className="w-full h-full object-cover block" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex justify-between items-center">
              <span className="text-sm text-white truncate max-w-[60%]">{fileName}</span>
              <button 
                type="button" 
                className="flex items-center gap-1 bg-red-500/90 hover:bg-red-500 text-white border-none rounded-lg px-2 py-1 text-xs cursor-pointer transition-all"
                onClick={handleRemove}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <svg className="w-12 h-12 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-sm text-gray-600">
              <span className="text-[#00E5FF] font-semibold">Click to upload</span> or drag and drop
            </span>
            <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
          </div>
        )}
      </div>

      {helperText && !error && (
        <span className="text-xs text-gray-400">{helperText}</span>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default ImageUpload;
