import { useForm } from 'react-hook-form';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, Plus, Image as ImageIcon, Trash2, CheckCircle } from 'lucide-react';

import { theme } from '../../theme';
import { Button } from '../../UI/Glow'; 
import { SelectBetter } from '../../UI/SelectBetter'; 
import { useAuth } from '../../auth/AuthContext'; 
import { createAnnouncement } from '../../Services/announcements.service';
import { supabase } from '../../Lib/supabaseClient';

const TARGET_HOSTELS = [
  { value: 'All', label: 'All Hostels' },
  { value: 'Sahyadri', label: 'Sahyadri' },
  { value: 'Aravali', label: 'Aravali' },
  { value: 'Nilgiri', label: 'Nilgiri' },
  { value: 'Vindhya', label: 'Vindhya' },
];

const TARGET_BLOCKS = [
  { value: 'All', label: 'All Blocks' },
  { value: 'A', label: 'Block A' },
  { value: 'B', label: 'Block B' },
  { value: 'C', label: 'Block C' },
  { value: 'Mess', label: 'Mess Area' },
];

const AdminAnnouncement = () => {
  const { user, isAdmin } = useAuth();
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef(null);

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
      targetHostel: 'All',
      targetBlock: 'All',
      pollOptions: ['', ''],
    },
  });

  const watchedHostel = watch('targetHostel');
  const watchedBlock = watch('targetBlock');
  const watchedPollOptions = watch('pollOptions');

  useEffect(() => {
    register('targetHostel', { required: 'Please select a target hostel' });
    register('targetBlock');
  }, [register]);

  const onSubmit = async (data) => {
    if (!user) return alert("Please login first.");
    if (!isAdmin) return alert("Only admins can create announcements.");

    try {
      // 1. Upload Image (Optional)
      let imageUrl = null;
      if (data.image) {
        const file = data.image;
        const fileExt = file.name.split('.').pop();
        const fileName = `announcements/${Date.now()}_${user.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('announcements-media') 
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('announcements-media')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrlData.publicUrl;
      }

      // 2. Prepare Poll JSON
      let pollDataJSON = null;
      if (showPoll) {
        const validOptions = data.pollOptions.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
          alert("A poll must have at least 2 options.");
          return;
        }
        
        const initialVotes = {};
        validOptions.forEach(opt => initialVotes[opt] = 0);
        
        pollDataJSON = {
          options: validOptions,
          votes: initialVotes,
          total_votes: 0,
          voters: []
        };
      }

      // 3. Create announcement
      await createAnnouncement({
        title: data.title,
        content: data.description,
        target_hostel: data.targetHostel,
        target_block: data.targetBlock,
        image_url: imageUrl,
        poll_data: pollDataJSON,
      }, user.id);

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      
      reset();
      setImagePreview(null);
      setShowPoll(false);

    } catch (error) {
      console.error('Error publishing:', error);
      alert('Failed to publish: ' + error.message);
    }
  };

  const handleSelectChange = (name, value) => {
    setValue(name, value);
    trigger(name);
  };

  const processFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert('Max file size 5MB');
    if (!file.type.startsWith('image/')) return alert('Images only');

    setValue('image', file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const addPollOption = () => {
    if (watchedPollOptions.length < 5) {
      setValue('pollOptions', [...watchedPollOptions, '']);
    }
  };

  const removePollOption = (index) => {
    if (watchedPollOptions.length > 2) {
      setValue('pollOptions', watchedPollOptions.filter((_, i) => i !== index));
    }
  };

  const inputStyles = `
    w-full px-4 py-3.5 rounded-full text-base
    bg-gray-50 border-2 border-transparent
    placeholder:text-gray-400
    outline-none transition-all duration-200
    focus:border-[#00E5FF] focus:bg-white focus:shadow-[0_0_15px_rgba(0,229,255,0.25)]
  `;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
      <div className="max-w-3xl mx-auto">
        
        {/* Success Toast */}
        <AnimatePresence>
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
            >
              <CheckCircle size={20} />
              Announcement published successfully!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#00B8D4] to-[#00E5FF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-200">
            <Megaphone className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">New Announcement</h1>
          <p className="text-gray-500">Broadcast updates to students. Admin only.</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`${theme.glass} rounded-3xl p-6 md:p-10 border border-white/50 shadow-xl`}
        >
          {/* Title */}
          <div className="mb-6">
            <label className="text-sm font-bold text-gray-700 block mb-2 ml-1">
              Headline<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              {...register('title', { required: 'Headline is required' })}
              type="text"
              placeholder="e.g., Annual Sports Day Registration"
              className={`${inputStyles} ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && <span className="text-xs text-red-500 mt-1 ml-1">{errors.title.message}</span>}
          </div>

          {/* Target Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <SelectBetter
              label="Target Hostel"
              name="targetHostel"
              options={TARGET_HOSTELS}
              value={watchedHostel}
              onChange={(e) => handleSelectChange('targetHostel', e.target.value)}
              error={errors.targetHostel?.message}
              required
            />
            <SelectBetter
              label="Target Block"
              name="targetBlock"
              options={TARGET_BLOCKS}
              value={watchedBlock}
              onChange={(e) => handleSelectChange('targetBlock', e.target.value)}
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="text-sm font-bold text-gray-700 block mb-2 ml-1">
              Content<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('description', { required: 'Content is required' })}
              placeholder="Write the full details here..."
              rows={5}
              className={`${inputStyles} !rounded-3xl min-h-[140px] resize-y`}
            />
            {errors.description && <span className="text-xs text-red-500 mt-1 ml-1">{errors.description.message}</span>}
          </div>

          {/* Image Upload */}
          <div className="mb-8">
            <label className="text-sm font-bold text-gray-700 block mb-2 ml-1">
              Attachment (Optional)
            </label>
            <input {...register('image')} type="hidden" />

            <div
              className={`
                relative overflow-hidden min-h-[160px] rounded-3xl cursor-pointer
                flex flex-col items-center justify-center transition-all duration-300
                ${imagePreview 
                  ? 'p-0 border-2 border-solid border-[#00B8D4]' 
                  : 'p-6 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-white hover:border-[#00B8D4]'
                }
                ${dragActive ? 'bg-blue-50 border-[#00B8D4]' : ''}
              `}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDrop={(e) => { 
                e.preventDefault(); setDragActive(false); 
                processFile(e.dataTransfer.files?.[0]); 
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => processFile(e.target.files?.[0])}
                className="hidden"
              />

              {imagePreview ? (
                <div className="w-full h-full relative group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover max-h-[400px]" />
                  <button
                    type="button"
                    className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); setImagePreview(null); setValue('image', null); }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <ImageIcon className="mx-auto text-gray-400" size={32} />
                  <p className="text-sm text-gray-500">
                    <span className="text-[#00B8D4] font-semibold">Click to upload</span> or drag and drop
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Poll Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 9h8"/><path d="M8 13h6"/>
                    <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Add a Poll</h3>
                  <p className="text-xs text-gray-500">Engage students with a question</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={showPoll}
                  onChange={() => setShowPoll(!showPoll)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00B8D4]"></div>
              </label>
            </div>

            <AnimatePresence>
              {showPoll && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 pl-2 space-y-3">
                    {watchedPollOptions.map((_, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <span className="text-sm font-bold text-gray-400 w-6">{index + 1}.</span>
                        <input
                          {...register(`pollOptions.${index}`)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-purple-400 outline-none"
                        />
                        {watchedPollOptions.length > 2 && (
                          <button type="button" onClick={() => removePollOption(index)} className="p-2 text-gray-400 hover:text-red-500">
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    {watchedPollOptions.length < 5 && (
                      <button type="button" onClick={addPollOption} className="ml-8 text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-2">
                        <Plus size={16} /> Add Option
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminAnnouncement;
