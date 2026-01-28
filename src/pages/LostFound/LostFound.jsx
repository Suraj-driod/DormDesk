import { useForm } from 'react-hook-form';
import { useRef, useState } from 'react';
import { theme } from '../../theme';

const STATUS_OPTIONS = [
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' },
];

const LostFound = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      status: 'lost',
    },
  });

  const onSubmit = (data) => {
    console.log('Lost & Found submitted:', data);
    alert('Lost & Found submitted successfully!');
  };

  const processFile = (file) => {
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
      return;
    }

    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      alert('Please upload an image file');
      return;
    }

    setValue('image', file);

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
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
    processFile(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setValue('image', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const inputStyles = `
    w-full px-4 py-3.5 rounded-xl text-base
    bg-gray-50 border-2 border-transparent
    placeholder:text-gray-400
    outline-none transition-all duration-200
    focus:border-[#00E5FF] focus:bg-white focus:shadow-[0_0_15px_rgba(0,229,255,0.25)]
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FEFF] to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Lost &amp; Found</h1>
          <p className="text-gray-500">Report an item you lost or found in the hostel</p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`${theme.glass} rounded-2xl p-6 md:p-8 ${theme.glow}`}
        >
          {/* Title */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-800 block mb-1">
              Title<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              type="text"
              placeholder="e.g., Black wallet, Room key, Water bottle"
              className={`${inputStyles} ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && <span className="text-xs text-red-500 mt-1">{errors.title.message}</span>}
          </div>

          {/* Status + Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Status */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1">Status</label>
              <div className="relative">
                <select
                  {...register('status')}
                  className={`${inputStyles} appearance-none pr-10 cursor-pointer`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 12,15 18,9" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1">Location</label>
              <input
                {...register('location')}
                type="text"
                placeholder="e.g., Mess hall, Block A corridor, Room 204"
                className={inputStyles}
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-800 block mb-1">Description</label>
            <textarea
              {...register('description')}
              placeholder="Add any details that can help identify the item..."
              rows={4}
              className={`${inputStyles} min-h-[120px] resize-y`}
            />
          </div>

          {/* Item Image (Optional) */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-800 block mb-1">
              Item Image (Optional)
            </label>

            {/* register so setValue('image', file) is part of form data */}
            <input {...register('image')} type="hidden" />

            <div
              className={`
                relative overflow-hidden min-h-[160px] rounded-xl cursor-pointer
                flex items-center justify-center transition-all duration-200
                ${
                  imagePreview
                    ? `p-0 border-2 border-solid border-[#7CF3FF] ${theme.glow}`
                    : `p-6 border-2 border-dashed border-[#00E5FF] bg-[#F0FEFF] hover:bg-[#E0F7FA]`
                }
                ${dragActive ? 'bg-[#E0F7FA] border-[#00B8D4]' : ''}
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
                accept="image/*"
                onChange={handleFileChange}
                className="absolute w-px h-px p-0 -m-px overflow-hidden border-0"
                style={{ clip: 'rect(0,0,0,0)' }}
              />

              {imagePreview ? (
                <div className="w-full h-full relative min-h-[160px]">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover block max-h-[300px]"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex justify-end">
                    <button
                      type="button"
                      className="flex items-center gap-1 bg-red-500/90 hover:bg-red-500 text-white border-none rounded-lg px-3 py-1.5 text-sm cursor-pointer transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
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
                  <svg className="w-10 h-10 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17,8 12,3 7,8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    <span className="text-[#00E5FF] font-semibold">Click to upload</span> or drag and drop
                  </span>
                  <span className="text-xs text-gray-400">Images up to 50MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full inline-flex items-center justify-center gap-2
              px-6 py-4 rounded-xl text-base font-semibold
              cursor-pointer transition-all duration-200
              ${theme.blueGrad} text-white ${theme.glow}
              hover:shadow-[0_0_35px_rgba(0,229,255,0.75)]
              focus-visible:outline-2 focus-visible:outline-[#00E5FF] focus-visible:outline-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-[0.98]
            `}
          >
            {isSubmitting ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="31.4 31.4"
                />
              </svg>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22,2 15,22 11,13 2,9 22,2" />
                </svg>
                Submit
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LostFound;
