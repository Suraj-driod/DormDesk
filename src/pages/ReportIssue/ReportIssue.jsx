import { useForm } from 'react-hook-form';
import { useState, useRef, useEffect } from 'react';
import { theme } from '../../theme';
import { SelectBetter } from '../../UI/SelectBetter';
import { Button, AlertModal } from '../../UI/Glow'; 
import { useAuth } from '../../auth/AuthContext';
import { useAlert } from '../../hooks/useAlert'; 
import { createIssue } from '../../Services/issues.service';
import { uploadToImgBB } from '../../Services/imgbb.service';

// 1. Categories (Matches issue_category Enum)
const CATEGORIES = [
  { value: 'plumbing', label: 'Water' },
  { value: 'electrical', label: 'Electricity' },
  { value: 'wifi', label: 'Internet' },
  { value: 'cleanliness', label: 'Cleaning' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'mess food', label: 'Food' },
  { value: 'other', label: 'Other' }
];

// 2. Urgency (Matches issue_priority Enum: 'Low', 'Medium', 'High')
const URGENCY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-red-500' },
];

// 3. Visibility (Matches issue_visibility_type Enum: 'Public', 'Private')
const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private (visible only to Admin)' },
];

const ReportIssue = () => {
  const { user } = useAuth(); 
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
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
      urgency: 'medium',
      category: '',
      visibility: '',
      dateTime: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    },
  });

  const watchedTitle = watch('title');
  const watchedDescription = watch('description');
  const watchedCategory = watch('category');
  const watchedVisibility = watch('visibility');
  const selectedUrgency = watch('urgency');

  useEffect(() => {
    register('category', { required: 'Please select a category' });
    register('visibility', { required: 'Please select visibility' });
  }, [register]);

  const isInitialSectionComplete =
    Boolean((watchedTitle ?? '').trim()) &&
    Boolean((watchedDescription ?? '').trim()) &&
    Boolean(watchedCategory) &&
    Boolean(watchedVisibility) &&
    Boolean(selectedUrgency);

  // --- SUBMISSION HANDLER ---
  const onSubmit = async (data) => {
    if (!user?.uid) {
      console.error("Submit blocked: No authenticated user");
      showWarning("You must be logged in to submit an issue.");
      return;
    }

    try {
      // 1. Upload Media to ImgBB (if exists)
      let mediaUrl = null;
      if (data.media && data.media.type?.startsWith('image/')) {
        try {
          console.log("Uploading image to ImgBB...");
          mediaUrl = await uploadToImgBB(data.media);
          console.log("Image uploaded successfully:", mediaUrl);
        } catch (uploadError) {
          console.warn("Image upload failed:", uploadError);
          // Continue without image if upload fails
        }
      }

      // 2. Build issue payload
      const issuePayload = {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.urgency,
        status: 'Reported',
        visibility: data.visibility,
        created_by: user.uid,
        hostel: data.hostelName,
        block: data.block,
        floor: data.floor || null,
        room_no: data.roomNumber || null,
        media_url: mediaUrl,
      };

      // 3. Create issue
      const result = await createIssue(issuePayload, false);

      if (result.isDuplicate) {
        showSuccess(result.message, {
          onClose: () => {
            reset();
            setMediaPreview(null);
            setMediaType(null);
          }
        });
      } else {
        showSuccess("Issue submitted successfully!", { 
          onClose: () => {
            reset(); 
            setMediaPreview(null);
            setMediaType(null);
          }
        });
      }

    } catch (err) {
      console.error('Error submitting issue:', err);
      const errorMessage = err?.message || 'Unknown error';
      showError(`Failed to submit issue: ${errorMessage}`);
    }
  };

  const handleSelectChange = (name, value) => {
    setValue(name, value);
    trigger(name);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;

    const maxSize = 32 * 1024 * 1024; // 32MB for ImgBB
    if (file.size > maxSize) {
      showWarning('File size must be less than 32MB');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      showWarning('Please upload an image or video file');
      return;
    }

    if (isVideo) {
      showWarning('Video upload is not supported. Please upload an image instead.');
      return;
    }

    setMediaType(isImage ? 'image' : 'video');
    setValue('media', file);

    const reader = new FileReader();
    reader.onload = (e) => setMediaPreview(e.target.result);
    reader.readAsDataURL(file);
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

  const removeMedia = () => {
    setMediaPreview(null);
    setMediaType(null);
    setValue('media', null);
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Report an Issue</h1>
          <p className="text-gray-500">Help us maintain your hostel by reporting any issues</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`${theme.glass} rounded-2xl p-6 md:p-8 ${theme.glow}`}
        >
          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
              Issue Title<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              {...register('title', { required: 'Issue title is required' })}
              type="text"
              placeholder="Brief description of the issue"
              className={`${inputStyles} ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && (
              <span className="text-xs text-red-500 mt-1 ml-1">{errors.title.message}</span>
            )}
          </div>

          <div className="mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <SelectBetter
                  label="Issue Category"
                  name="category"
                  placeholder="Select category"
                  options={CATEGORIES}
                  value={watchedCategory}
                  onChange={(e) => handleSelectChange('category', e.target.value)}
                  error={errors.category?.message}
                  required
                />
              </div>
              <div>
                <SelectBetter
                  label="Visibility"
                  name="visibility"
                  placeholder="Select visibility"
                  options={VISIBILITY_OPTIONS}
                  value={watchedVisibility}
                  onChange={(e) => handleSelectChange('visibility', e.target.value)}
                  error={errors.visibility?.message}
                  required
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
                Urgency Level<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="flex gap-2">
                {URGENCY_LEVELS.map((level) => (
                  <label
                    key={level.value}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-3 py-3.5 rounded-full cursor-pointer
                      border-2 transition-all duration-200
                      ${
                        selectedUrgency === level.value
                          ? 'border-[#00E5FF] bg-[#F0FEFF] shadow-[0_0_10px_rgba(0,229,255,0.25)]'
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }
                    `}
                  >
                    <input
                      {...register('urgency')}
                      type="radio"
                      value={level.value}
                      className="sr-only"
                    />
                    <span className={`w-2.5 h-2.5 rounded-full ${level.color}`} />
                    <span className="text-sm font-medium text-gray-700">{level.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
              Description<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 10, message: 'Please provide more details (min 10 characters)' },
              })}
              placeholder="Describe the issue in detail..."
              rows={4}
              className={`${inputStyles} !rounded-2xl min-h-[120px] resize-y ${
                errors.description ? 'border-red-500' : ''
              }`}
            />
            {errors.description && (
              <span className="text-xs text-red-500 mt-1 ml-1">{errors.description.message}</span>
            )}
          </div>

          {isInitialSectionComplete && (
            <>
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2 ml-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Location Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
                      Hostel Name<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      {...register('hostelName', { required: 'Hostel name is required' })}
                      type="text"
                      placeholder="e.g., Krishna Hostel"
                      className={`${inputStyles} ${errors.hostelName ? 'border-red-500' : ''}`}
                    />
                    {errors.hostelName && (
                      <span className="text-xs text-red-500 mt-1 ml-1">{errors.hostelName.message}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
                      Block Name / Number<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      {...register('block', { required: 'Block is required' })}
                      type="text"
                      placeholder="e.g., Block A"
                      className={`${inputStyles} ${errors.block ? 'border-red-500' : ''}`}
                    />
                    {errors.block && (
                      <span className="text-xs text-red-500 mt-1 ml-1">{errors.block.message}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
                      Floor Number<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      {...register('floor', { required: 'Floor number is required' })}
                      type="text"
                      placeholder="e.g., 2nd Floor"
                      className={`${inputStyles} ${errors.floor ? 'border-red-500' : ''}`}
                    />
                    {errors.floor && (
                      <span className="text-xs text-red-500 mt-1 ml-1">{errors.floor.message}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
                      Room Number
                    </label>
                    <input
                      {...register('roomNumber')}
                      type="text"
                      placeholder="e.g., 204 (Optional)"
                      className={inputStyles}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
                  Photo Proof (Images only)
                </label>
                <div
                  className={`
                    relative overflow-hidden min-h-[160px] rounded-2xl cursor-pointer
                    flex items-center justify-center transition-all duration-200
                    ${
                      mediaPreview
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

                  {mediaPreview ? (
                    <div className="w-full h-full relative min-h-[160px]">
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="w-full h-full object-cover block max-h-[300px]"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex justify-end">
                        <button
                          type="button"
                          className="flex items-center gap-1 bg-red-500/90 hover:bg-red-500 text-white border-none rounded-full px-3 py-1.5 text-sm cursor-pointer transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMedia();
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

              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
                  Date & Time
                </label>
                <input
                  {...register('dateTime')}
                  type="text"
                  readOnly
                  className={`${inputStyles} bg-gray-100 cursor-not-allowed`}
                />
                <span className="text-xs text-gray-400 mt-1 block ml-1">Auto-filled based on current time</span>
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
                    Submit Issue
                  </>
                )}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;
