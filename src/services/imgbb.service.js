// ImgBB Image Upload Service
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

/**
 * Upload an image to ImgBB and return the URL
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - The URL of the uploaded image
 */
export const uploadToImgBB = async (file) => {
  if (!file) return null;
  
  if (!IMGBB_API_KEY) {
    console.warn("ImgBB API key not configured. Image upload disabled.");
    throw new Error("Image upload service not configured");
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error("Only image files are supported for upload");
  }

  // Max size 32MB for ImgBB
  const maxSize = 32 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File size must be less than 32MB");
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || "Upload failed");
    }

    return data.data.url;
  } catch (error) {
    console.error("ImgBB upload error:", error);
    throw error;
  }
};

/**
 * Upload multiple images to ImgBB
 * @param {File[]} files - Array of image files
 * @returns {Promise<string[]>} - Array of uploaded image URLs
 */
export const uploadMultipleToImgBB = async (files) => {
  if (!files || files.length === 0) return [];
  
  const uploadPromises = files.map(file => uploadToImgBB(file));
  return Promise.all(uploadPromises);
};
