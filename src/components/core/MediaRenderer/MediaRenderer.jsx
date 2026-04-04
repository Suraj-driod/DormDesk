import { useState } from 'react';
import { normalizeLegacyMedia } from '../../../services/mediaService';

/**
 * MediaRenderer — renders a media array inline in feed cards and detail pages.
 *
 * Handles:
 *  - image  → lazy-loaded <img>, click opens fullscreen lightbox
 *  - video  → native HTML5 <video> with controls, poster from Cloudinary thumbnail
 *  - audio  → native HTML5 <audio> with controls, styled filename header
 *  - legacy → posts with imageUrl / media_url string field rendered as images
 *
 * Grid layout:
 *  1 item  → full width
 *  2 items → side by side
 *  3 items → 1 full + 2 side by side
 *  4+      → 2x2 grid, last item shows "+N more" overlay
 *
 * Props:
 *  post       — Firestore document object (will normalize legacy fields)
 *  mediaArray — optional explicit array override (takes precedence over post)
 *  maxHeight  — max-height for video in feed (default "400px")
 *  fullSize   — if true, show at full height (detail view)
 */
const MediaRenderer = ({ post, mediaArray, maxHeight = '400px', fullSize = false }) => {
  const [lightbox, setLightbox] = useState(null); // url string when open

  // Resolve the media array
  const items = mediaArray ?? normalizeLegacyMedia(post);

  if (!items || items.length === 0) return null;

  const displayItems = items.slice(0, 4);
  const extraCount = Math.max(0, items.length - 4);

  /* ── Single item renderer ──────────────────────────────────────────────── */

  const renderSingleItem = (item, idx, showOverlay = false) => {
    const { url, resourceType, thumbnail, format } = item;
    const type = resourceType || 'image';

    if (type === 'image') {
      return (
        <div
          key={idx}
          className="relative w-full h-full group cursor-zoom-in overflow-hidden bg-gray-100"
          onClick={() => setLightbox(url)}
        >
          <img
            src={url}
            alt={`Media ${idx + 1}`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          {showOverlay && extraCount > 0 && idx === 3 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-2xl font-bold tracking-wide">+{extraCount}</span>
            </div>
          )}
          {/* Zoom icon hint */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-black/40 text-white rounded-full p-1.5 block">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </span>
          </div>
        </div>
      );
    }

    if (type === 'video') {
      return (
        <div key={idx} className="relative w-full h-full overflow-hidden bg-gray-900 rounded-xl">
          <video
            src={url}
            controls
            preload="metadata"
            poster={thumbnail || undefined}
            className="w-full object-contain"
            style={{ maxHeight: fullSize ? 'none' : maxHeight }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (type === 'audio') {
      const fileName = url.split('/').pop()?.split('?')[0] || 'Audio file';
      return (
        <div key={idx} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {/* Audio header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#F0FEFF] to-white border-b border-gray-100">
            <span className="text-[#00B8D4] flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{decodeURIComponent(fileName)}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{format || 'audio'}</p>
            </div>
          </div>
          <div className="px-4 py-3">
            <audio controls preload="metadata" className="w-full" style={{ height: '36px' }}>
              <source src={url} />
              Your browser does not support audio playback.
            </audio>
          </div>
        </div>
      );
    }

    // Fallback: treat unknown as image
    return (
      <div key={idx} className="rounded-xl overflow-hidden bg-gray-100">
        <img src={url} alt={`Media ${idx + 1}`} loading="lazy" className="w-full object-cover" />
      </div>
    );
  };

  /* ── Grid Layout ───────────────────────────────────────────────────────── */

  const count = displayItems.length;

  const gridClass = (() => {
    if (count === 1) return null; // full width — no grid needed
    if (count === 2) return 'grid grid-cols-2 gap-1';
    if (count === 3) return null; // custom: 1 full + 2 side
    return 'grid grid-cols-2 gap-1'; // 4
  })();

  const renderGrid = () => {
    // Need special audio handling — audios break the visual media grid, render them stacked
    const hasAudio = displayItems.some(i => i.resourceType === 'audio');
    if (hasAudio) {
      return (
        <div className="flex flex-col gap-2">
          {displayItems.map((item, idx) => (
            <div key={idx}>{renderSingleItem(item, idx)}</div>
          ))}
        </div>
      );
    }

    if (count === 1) {
      return (
        <div className="rounded-xl overflow-hidden" style={{ maxHeight: fullSize ? 'none' : maxHeight }}>
          {renderSingleItem(displayItems[0], 0)}
        </div>
      );
    }

    const imageHeight = fullSize ? '300px' : '200px';

    if (count === 2) {
      return (
        <div className={gridClass}>
          {displayItems.map((item, idx) => (
            <div key={idx} className="rounded-xl overflow-hidden" style={{ height: imageHeight }}>
              {renderSingleItem(item, idx)}
            </div>
          ))}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className="flex flex-col gap-1">
          <div className="rounded-xl overflow-hidden" style={{ maxHeight: fullSize ? 'none' : maxHeight }}>
            {renderSingleItem(displayItems[0], 0)}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {displayItems.slice(1).map((item, idx) => (
              <div key={idx + 1} className="rounded-xl overflow-hidden" style={{ height: imageHeight }}>
                {renderSingleItem(item, idx + 1)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 4 items — 2x2 grid
    return (
      <div className={gridClass}>
        {displayItems.map((item, idx) => (
          <div key={idx} className="rounded-xl overflow-hidden" style={{ height: imageHeight }}>
            {renderSingleItem(item, idx, true /* showOverlay */)}
          </div>
        ))}
      </div>
    );
  };

  /* ── Lightbox ──────────────────────────────────────────────────────────── */

  const Lightbox = () => {
    if (!lightbox) return null;
    return (
      <div
        className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
        onClick={() => setLightbox(null)}
      >
        <button
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
          onClick={() => setLightbox(null)}
          type="button"
          aria-label="Close lightbox"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <img
          src={lightbox}
          alt="Full size"
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  };

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <>
      <div className="w-full">
        {renderGrid()}
      </div>
      <Lightbox />
    </>
  );
};

export default MediaRenderer;
