import { useForm } from 'react-hook-form';
import { useRef, useEffect } from 'react';
import { theme } from '../../theme';
import { Button, AlertModal } from '../../UI/Glow'; 
import { SelectBetter } from '../../UI/SelectBetter'; 
import { useAuth } from '../../auth/AuthContext';
import { useAlert } from '../../hooks/useAlert';
import { createComplaint } from '../../services/complaints.service';
import MediaUpload from '../../components/core/MediaUpload/MediaUpload';

const COMPLAINT_TYPES = [
  { value: 'caretaker', label: 'Caretaker' },
  { value: 'admin', label: 'Admin' },
  { value: 'student', label: 'Student' },
];

const Complaint = () => {
  const { user, profile } = useAuth(); 
  const mediaUploadRef = useRef(null);
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
      // Upload media to Cloudinary on submit
      let mediaArray = [];
      if (mediaUploadRef.current) {
        mediaArray = await mediaUploadRef.current.triggerUpload();
      }

      await createComplaint({
        complaint_type: data.complaintType,
        description: data.description,
        accused_user: data.accusedName,
        media: mediaArray,
        // Auto-attach hostel location from profile
        hostelName: profile?.hostelName || '',
        blockName: profile?.blockName || '',
        floor: profile?.floor || null,
        flatNumber: profile?.flatNumber || '',
      }, user.uid, profile?.hostelId);

      showSuccess('Complaint submitted successfully!', {
        onClose: () => {
          reset();
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

          {/* Location (auto-filled from profile) */}
          {profile?.hostelName && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2 ml-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Your Location
                <span className="text-xs font-normal text-[#00B8D4] bg-[#F0FEFF] px-2 py-0.5 rounded-full">Auto-filled</span>
              </h3>
              <div className={`${inputStyles} bg-gray-100 cursor-not-allowed text-gray-600`}>
                {[profile.hostelName, profile.blockName, profile.floor ? `Floor ${profile.floor}` : null, profile.flatNumber ? `Flat ${profile.flatNumber}` : null].filter(Boolean).join(' · ')}
              </div>
            </div>
          )}

          {/* Media Upload */}
          <div className="mb-5">
            <MediaUpload
              ref={mediaUploadRef}
              label="Media Proof (Optional — image, video, or audio)"
              maxFiles={3}
              accept="image/*,video/*,audio/*"
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
              Incident Date &amp; Time (Optional)
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
