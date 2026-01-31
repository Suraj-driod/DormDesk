import { useForm } from 'react-hook-form';
import { useRef, useState, useEffect } from 'react';
import { theme } from '../../theme';
import { Button, AlertModal } from '../../UI/Glow'; 
import { SelectBetter } from '../../UI/SelectBetter'; 
import { useAuth } from '../../auth/AuthContext';
import { useAlert } from '../../hooks/useAlert';
import { createComplaint } from '../../services/complaints.service';
import { uploadToImgBB } from '../../services/imgbb.service';

const COMPLAINT_TYPES = [
  { value: 'caretaker', label: 'Caretaker' },
  { value: 'admin', label: 'Admin' },
  { value: 'student', label: 'Student' },
];

const Complaint = () => {
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
      complaintType: '',
      incidentDateTime: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    },
  });

  const watchedComplaintType = watch('complaintType');

  useEffect(() => {
    register('complaintType', { required: 'Please select a complaint type' });
  }, [register]);

  const onSubmit = async (data) => {
    if (!user) {
      showWarning("Please login to submit a complaint.");
      return;
    }

    try {
      // Upload media to ImgBB if exists
      let mediaUrl = null;
      if (data.media && data.media.type?.startsWith('image/')) {
        try {
          mediaUrl = await uploadToImgBB(data.media);
        } catch (uploadError) {
          console.warn("Image upload failed:", uploadError);
        }
      }

      await createComplaint({
        complaint_type: data.complaintType,
        description: data.description,
        accused_user: data.accusedName,
        media_url: mediaUrl,
      }, user.uid);

      showSuccess('Complaint submitted successfully!', {
        onClose: () => {
          reset();
          setMediaPreview(null);
          setMediaType(null);
        }
      });

    } catch (err) {
      console.error('Error submitting complaint:', err);
      showError('Failed to submit: ' + err.message);
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
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      showWarning('Please upload an image file');
      return;
    }
    setMediaType('image');
    setValue('media', file);
    const reader = new FileReader();
    reader.onload = (ev) => setMediaPreview(ev.target.result);
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">File a Complaint</h1>
          <p className="text-gray-500">Submit a complaint with relevant details and optional proof</p>
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
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 3, message: 'Title must be at least 3 characters' },
              })}
              type="text"
              placeholder="Brief complaint title"
              className={`${inputStyles} ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && <span className="text-xs text-red-500 mt-1 ml-1">{errors.title.message}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Complaint Type */}
            <div>
              <SelectBetter
                label="Complaint Type"
                name="complaintType"
                placeholder="Select type"
                options={COMPLAINT_TYPES}
                value={watchedComplaintType}
                onChange={(e) => handleSelectChange('complaintType', e.target.value)}
                error={errors.complaintType?.message}
                required
              />
            </div>

            {/* Accused Name */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
                Accused Name<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                {...register('accusedName', {
                  required: 'Accused name is required',
                  minLength: { value: 2, message: 'Please enter a valid name' },
                })}
                type="text"
                placeholder="Name of the person"
                className={`${inputStyles} ${errors.accusedName ? 'border-red-500' : ''}`}
              />
              {errors.accusedName && (
                <span className="text-xs text-red-500 mt-1 ml-1">{errors.accusedName.message}</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
              Description<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 10, message: 'Please provide more details (min 10 characters)' },
              })}
              placeholder="Describe the complaint in detail..."
              rows={4}
              className={`${inputStyles} !rounded-2xl min-h-[120px] resize-y ${
                errors.description ? 'border-red-500' : ''
              }`}
            />
            {errors.description && (
              <span className="text-xs text-red-500 mt-1 ml-1">{errors.description.message}</span>
            )}
          </div>

          {/* Media Proof */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
              Media Proof (Optional - Images only)
            </label>

            <input {...register('media')} type="hidden" />

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
              Incident Date & Time (Optional)
            </label>
            <input
              {...register('incidentDateTime')}
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
                Submit Complaint
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Complaint;
