import { useForm } from 'react-hook-form';
import { useRef, useState, useEffect } from 'react';
import { theme } from '../../theme';
import { Button, AlertModal } from '../../UI/Glow'; 
import { SelectBetter } from '../../UI/SelectBetter'; 
import { useAuth } from '../../auth/AuthContext';
import { useAlert } from '../../hooks/useAlert';
import { createLostItem } from '../../services/lostItems.service';
import { uploadToImgBB } from '../../services/imgbb.service';

// Enum values match your DB: {lost, found, claimed}
const STATUS_OPTIONS = [
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' },
];

const LostFound = () => {
  const { user } = useAuth();
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { alertState, closeAlert, success: showSuccess, error: showError, warning: showWarning } = useAlert();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger, 
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      status: 'lost',
    },
  });

  const watchedStatus = watch('status');

  useEffect(() => {
    register('status', { required: 'Please select a status' });
  }, [register]);

  // --- SUBMIT HANDLER ---
  const onSubmit = async (data) => {
    if (!user) {
      showWarning("Please login to report an item.");
      return;
    }

    try {
      // Upload image to ImgBB if exists
      let imageUrl = null;
      if (data.image && data.image.type?.startsWith('image/')) {
        try {
          imageUrl = await uploadToImgBB(data.image);
        } catch (uploadError) {
          console.warn("Image upload failed:", uploadError);
        }
      }

      await createLostItem({
        title: data.title,
        description: data.description,
        location: data.location,
        status: data.status,
        image_url: imageUrl,
      }, user.uid);

      showSuccess('Item reported successfully!', {
        onClose: () => {
          reset();
          setImagePreview(null);
        }
      });

    } catch (err) {
      console.error('Error submitting lost & found:', err);
      showError('Failed to submit: ' + err.message);
    }
  };

  const handleSelectChange = (name, value) => {
    setValue(name, value);
    trigger(name);
  };

  const processFile = (file) => {
    if (!file) return;

    const maxSize = 32 * 1024 * 1024; // 32MB for ImgBB
    if (file.size > maxSize) {
      showWarning('File size must be less than 32MB');
      return;
    }

    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      showWarning('Please upload an image file');
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
    w-full px-4 py-3.5 rounded-full text-base
    bg-gray-50 border-2 border-transparent
    placeholder:text-gray-400
    outline-none transition-all duration-200
    focus:border-[#00E5FF] focus:bg-white focus:shadow-[0_0_15px_rgba(0,229,255,0.25)]
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FEFF] to-white py-8 px-4">
      <AlertModal {...alertState} onClose={closeAlert} />
      
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Lost &amp; Found</h1>
          <p className="text-gray-500">Report an item you lost or found in the hostel</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`${theme.glass} rounded-2xl p-6 md:p-8 ${theme.glow}`}
        >
          {/* Title */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
              Title<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              type="text"
              placeholder="e.g., Black wallet, Room key, Water bottle"
              className={`${inputStyles} ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && <span className="text-xs text-red-500 mt-1 ml-1">{errors.title.message}</span>}
          </div>

          {/* Status + Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            
            {/* Status (SelectBetter) */}
            <div>
              <SelectBetter
                label="Status"
                name="status"
                placeholder="Select Status"
                options={STATUS_OPTIONS}
                value={watchedStatus}
                onChange={(e) => handleSelectChange('status', e.target.value)}
                error={errors.status?.message}
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">Location</label>
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
            <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">Description</label>
            <textarea
              {...register('description')}
              placeholder="Add any details that can help identify the item..."
              rows={4}
              className={`${inputStyles} !rounded-2xl min-h-[120px] resize-y`}
            />
          </div>

          {/* Item Image (Optional) */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
              Item Image (Optional)
            </label>

            <input {...register('image')} type="hidden" />

            <div
              className={`
                relative overflow-hidden min-h-[160px] rounded-2xl cursor-pointer
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
                      className="flex items-center gap-1 bg-red-500/90 hover:bg-red-500 text-white border-none rounded-full px-3 py-1.5 text-sm cursor-pointer transition-all"
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
                  <span className="text-xs text-gray-400">Images up to 32MB</span>
                </div>
              )}
            </div>
          </div>

          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" />
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
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LostFound;
