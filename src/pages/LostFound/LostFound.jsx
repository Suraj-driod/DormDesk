import { useForm } from 'react-hook-form';
import { useRef, useEffect } from 'react';
import { theme } from '../../theme';
import { Button, AlertModal } from '../../UI/Glow'; 
import { SelectBetter } from '../../UI/SelectBetter'; 
import { useAuth } from '../../auth/AuthContext';
import { useAlert } from '../../hooks/useAlert';
import { createLostItem } from '../../services/lostItems.service';
import MediaUpload from '../../components/core/MediaUpload/MediaUpload';

// Enum values match your DB: {lost, found, claimed}
const STATUS_OPTIONS = [
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' },
];

const LostFound = () => {
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
      status: 'lost',
    },
  });

  const watchedStatus = watch('status');

  useEffect(() => {
    register('status', { required: 'Please select a status' });
  }, [register]);

  // Auto-fill location from student profile
  useEffect(() => {
    if (profile) {
      const parts = [
        profile.hostelName,
        profile.blockName,
        profile.floor ? `Floor ${profile.floor}` : null,
        profile.flatNumber ? `Flat ${profile.flatNumber}` : null,
      ].filter(Boolean);
      if (parts.length > 0) {
        setValue('location', parts.join(', '));
      }
    }
  }, [profile, setValue]);

  // --- SUBMIT HANDLER ---
  const onSubmit = async (data) => {
    if (!user) {
      showWarning("Please login to report an item.");
      return;
    }

    try {
      // Upload media to Cloudinary on submit
      let mediaArray = [];
      if (mediaUploadRef.current) {
        mediaArray = await mediaUploadRef.current.triggerUpload();
      }

      await createLostItem({
        title: data.title,
        description: data.description,
        location: data.location,
        status: data.status,
        media: mediaArray,
      }, user.uid, profile?.hostelId);

      showSuccess('Item reported successfully!', {
        onClose: () => {
          reset();
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

          {/* Media Upload */}
          <div className="mb-6">
            <MediaUpload
              ref={mediaUploadRef}
              label="Item Photo / Video (Optional)"
              maxFiles={3}
              accept="image/*,video/*"
            />
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
