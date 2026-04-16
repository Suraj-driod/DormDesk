import { useForm } from 'react-hook-form';
import { useState, useRef, useEffect } from 'react';
import { theme } from '../../theme';
import { SelectBetter } from '../../UI/SelectBetter';
import { Button, AlertModal } from '../../UI/Glow'; 
import { useAuth } from '../../auth/AuthContext';
import { useAlert } from '../../hooks/useAlert'; 
import { createIssue } from '../../services/issues.service';
import MediaUpload from '../../components/core/MediaUpload/MediaUpload';

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
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', color: 'bg-red-700' },
];

// 3. Visibility (Matches issue_visibility_type Enum: 'Public', 'Private')
const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private (visible only to Admin)' },
];

const ReportIssue = () => {
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

  // Auto-fill location details from student profile
  useEffect(() => {
    if (profile) {
      setValue('hostelName', profile.hostelName || '');
      setValue('block', profile.blockName || '');
      setValue('floor', profile.floor ? String(profile.floor) : '');
      setValue('roomNumber', profile.flatNumber || '');
    }
  }, [profile, setValue]);

  const isInitialSectionComplete =
    Boolean((watchedTitle ?? '').trim()) &&
    Boolean((watchedDescription ?? '').trim()) &&
    Boolean(watchedCategory) &&
    Boolean(watchedVisibility) &&
    Boolean(selectedUrgency);

  // --- SUBMISSION HANDLER ---
  const onSubmit = async (data) => {
    if (!user?.uid || !profile?.hostelId) {
      showWarning("You must be logged in and assigned to a hostel to submit an issue.");
      return;
    }

    try {
      // 1. Upload media files to Cloudinary (upload happens here on submit)
      let mediaArray = [];
      if (mediaUploadRef.current) {
        mediaArray = await mediaUploadRef.current.triggerUpload();
      }

      // 2. Build issue payload — new schema stores media array
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
        media: mediaArray,
      };

      // 3. Create issue
      const result = await createIssue(issuePayload, profile.hostelId, false);

      if (result.isDuplicate) {
        showSuccess(result.message, { onClose: () => reset() });
      } else {
        showSuccess("Issue submitted successfully!", { onClose: () => reset() });
      }

    } catch (err) {
      console.error('Error submitting issue:', err);
      showError(`Failed to submit issue: ${err?.message || 'Unknown error'}`);
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
                  <span className="text-xs font-normal text-[#00B8D4] bg-[#F0FEFF] px-2 py-0.5 rounded-full">Auto-filled from your profile</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
                      Hostel Name<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      {...register('hostelName', { required: 'Hostel name is required' })}
                      type="text"
                      readOnly
                      className={`${inputStyles} bg-gray-100 cursor-not-allowed ${errors.hostelName ? 'border-red-500' : ''}`}
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
                      readOnly
                      className={`${inputStyles} bg-gray-100 cursor-not-allowed ${errors.block ? 'border-red-500' : ''}`}
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
                      readOnly
                      className={`${inputStyles} bg-gray-100 cursor-not-allowed ${errors.floor ? 'border-red-500' : ''}`}
                    />
                    {errors.floor && (
                      <span className="text-xs text-red-500 mt-1 ml-1">{errors.floor.message}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-800 block mb-1 ml-1">
                      Flat / Room Number
                    </label>
                    <input
                      {...register('roomNumber')}
                      type="text"
                      readOnly
                      className={`${inputStyles} bg-gray-100 cursor-not-allowed`}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <MediaUpload
                  ref={mediaUploadRef}
                  label="Photo / Video / Audio Proof (Optional)"
                  maxFiles={3}
                  accept="image/*,video/*,audio/*"
                />
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
