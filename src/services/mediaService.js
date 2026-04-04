/**
 * Centralized Media Upload Service — Cloudinary (unsigned uploads)
 * Supports image, video, and audio. Uses XMLHttpRequest for progress tracking.
 * Do NOT expose API secret in frontend. Use unsigned upload preset only.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// File validation rules
export const MEDIA_RULES = {
  image: {
    accept: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    maxBytes: 10 * 1024 * 1024, // 10MB
    label: 'jpg, jpeg, png, webp, gif — max 10MB',
  },
  video: {
    accept: ['video/mp4', 'video/quicktime', 'video/webm'],
    maxBytes: 50 * 1024 * 1024, // 50MB
    label: 'mp4, mov, webm — max 50MB',
  },
  audio: {
    accept: ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/ogg', 'audio/mp4'],
    maxBytes: 20 * 1024 * 1024, // 20MB
    label: 'mp3, wav, m4a, ogg — max 20MB',
  },
};

/**
 * Detect media category from MIME type
 * @param {File} file
 * @returns {'image'|'video'|'audio'|null}
 */
export const detectMediaCategory = (file) => {
  if (!file) return null;
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return null;
};

/**
 * Validate a file against the media rules
 * @param {File} file
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateMedia = (file) => {
  const category = detectMediaCategory(file);
  if (!category) {
    return { valid: false, error: `Unsupported file type: ${file.type}. Allowed: images (jpg, png, webp, gif), videos (mp4, mov, webm), audio (mp3, wav, m4a, ogg).` };
  }
  const rule = MEDIA_RULES[category];
  if (!rule.accept.includes(file.type)) {
    return { valid: false, error: `"${file.name}" is not a supported ${category} format. Allowed: ${rule.label}.` };
  }
  if (file.size > rule.maxBytes) {
    const maxMB = rule.maxBytes / (1024 * 1024);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `"${file.name}" is ${sizeMB}MB — exceeds the ${maxMB}MB limit for ${category} files.` };
  }
  return { valid: true, error: null };
};

/**
 * Upload a single file to Cloudinary using unsigned upload.
 * Uses XMLHttpRequest so we can track upload progress.
 *
 * @param {File} file - The file to upload
 * @param {(percent: number) => void} [onProgress] - Progress callback (0–100)
 * @returns {Promise<{ url: string, publicId: string, resourceType: string, format: string, duration?: number }>}
 */
export const uploadMedia = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      return reject(new Error('Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env'));
    }

    const validation = validateMedia(file);
    if (!validation.valid) {
      return reject(new Error(validation.error));
    }

    const category = detectMediaCategory(file);
    // Cloudinary treats audio uploads under the "video" resource_type
    const cloudinaryResourceType = category === 'audio' ? 'video' : category;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${cloudinaryResourceType}/upload`;

    xhr.open('POST', endpoint, true);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            url: data.secure_url,
            publicId: data.public_id,
            resourceType: category, // "image" | "video" | "audio" (our semantic type)
            format: data.format,
            duration: data.duration ?? null, // only present for video/audio
            // Cloudinary thumbnail: works for images and videos
            thumbnail: category === 'image'
              ? data.secure_url
              : `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_0/${data.public_id}.jpg`,
          });
        } catch (parseError) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        let errorMessage = `Upload failed (${xhr.status})`;
        try {
          const errData = JSON.parse(xhr.responseText);
          errorMessage = errData?.error?.message || errorMessage;
        } catch (_) { /* ignore */ }
        reject(new Error(errorMessage));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload. Please check your connection.'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled.'));
    });

    xhr.send(formData);
  });
};

/**
 * Upload multiple files to Cloudinary in parallel, tracking individual progress.
 * @param {File[]} files
 * @param {(fileIndex: number, percent: number) => void} [onProgress]
 * @returns {Promise<Array<{ url, publicId, resourceType, format, duration, thumbnail }>>}
 */
export const uploadMultipleMedia = async (files, onProgress) => {
  if (!files || files.length === 0) return [];
  return Promise.all(
    files.map((file, idx) =>
      uploadMedia(file, (pct) => onProgress?.(idx, pct))
    )
  );
};

/**
 * Stub for future server-side deletion (requires backend / signed requests).
 * Cannot be done from an unsigned frontend config without exposing the API secret.
 * @param {string} _publicId
 */
export const deleteMedia = async (_publicId) => {
  console.warn('deleteMedia: Deletion from the frontend requires a signed request. Implement a backend endpoint for this.');
};

/**
 * Normalize legacy posts that store a single imageUrl / media_url string
 * into the standard media array format used by the new schema.
 * @param {object} post - Firestore document data
 * @returns {Array<{ url, resourceType, publicId, format, thumbnail }>}
 */
export const normalizeLegacyMedia = (post) => {
  if (!post) return [];

  // Already has a media array with objects
  if (Array.isArray(post.media) && post.media.length > 0 && typeof post.media[0] === 'object') {
    return post.media;
  }

  // Legacy: media is an array of URL strings
  if (Array.isArray(post.media) && post.media.length > 0) {
    return post.media.map((url) => ({ url, resourceType: 'image', publicId: null, format: null, thumbnail: url }));
  }

  // Legacy: single URL string field
  const legacyUrl = post.media_url || post.image_url;
  if (legacyUrl && typeof legacyUrl === 'string') {
    return [{ url: legacyUrl, resourceType: 'image', publicId: null, format: null, thumbnail: legacyUrl }];
  }

  return [];
};
