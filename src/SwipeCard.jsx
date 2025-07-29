// src/SwipeCard.jsx
import { useState, useEffect } from 'react';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from './storage';

const FALLBACK_IMAGE = 'https://placehold.co/800x1200/222/fff?text=No+Image';

export default function SwipeCard({ movie, onSwipe, isTopCard, imgIdx, setImgIdx }) {
  const { title, year, description, images, rating, cast, providers, certification, genres } = movie;
  const [imgError, setImgError] = useState(false);
  const controls = useAnimation();
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist(movie.id));

  // ✨ FIX: Use useEffect to set the default animation state
  useEffect(() => {
    // This sets the card's appearance when it mounts or when its position in the stack changes.
    controls.start({
      scale: isTopCard ? 1 : 0.95,
      y: isTopCard ? 0 : -20,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    });
  }, [isTopCard, controls]);

  const handleTap = (e) => {
    if (!isTopCard) return;

    const { clientX, currentTarget } = e;
    if (!currentTarget) return;
    const { left, width } = currentTarget.getBoundingClientRect();
    const tapPosition = clientX - left;
    const imageCount = images?.length || 1;

    if (tapPosition > width / 2) {
      if (imgIdx < imageCount - 1) {
        setImgIdx(imgIdx + 1);
      } else {
        // Trigger shake animation
        controls.start({ x: [0, 10, -10, 10, 0], transition: { duration: 0.4 } });
      }
    } else {
      if (imgIdx > 0) {
        setImgIdx(imgIdx - 1);
      } else {
        // Trigger shake animation
        controls.start({ x: [0, -10, 10, -10, 0], transition: { duration: 0.4 } });
      }
    }
  };

  // Gallery tap handler
  const handleGalleryTap = (e) => {
    if (!isTopCard) return;
    const { clientX, currentTarget } = e;
    if (!currentTarget) return;
    const { left, width } = currentTarget.getBoundingClientRect();
    const tapPosition = clientX - left;
    const imageCount = images?.length || 1;
    if (tapPosition > width / 2) {
      if (imgIdx < imageCount - 1) {
        setImgIdx(imgIdx + 1);
      } else {
        controls.start({ x: [0, 10, -10, 10, 0], transition: { duration: 0.4 } });
      }
    } else {
      if (imgIdx > 0) {
        setImgIdx(imgIdx - 1);
      } else {
        controls.start({ x: [0, -10, 10, -10, 0], transition: { duration: 0.4 } });
      }
    }
  };

  useEffect(() => {
    setImgIdx(0);
    setImgError(false);
    setInWatchlist(isInWatchlist(movie.id));
  }, [movie]);

  let currImg = (images && images[imgIdx]) || FALLBACK_IMAGE;
  if (!images || !Array.isArray(images) || images.length === 0) {
    currImg = FALLBACK_IMAGE;
  }
  if (imgError) currImg = FALLBACK_IMAGE;

  const handleWatchlist = (e) => {
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(movie.id);
      setInWatchlist(false);
    } else {
      addToWatchlist(movie);
      setInWatchlist(true);
    }
  };

  // Use 'NR' if certification is missing
  const certDisplay = certification && certification.trim() ? certification : 'NR';

  // Full-screen swipeable card with image gallery and text overlay
  return (
    <div
      className="fixed inset-0 w-screen h-screen flex flex-col items-end justify-end bg-black select-none"
      style={{
        backgroundImage: `url(${currImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 0,
        boxShadow: 'none',
        color: 'white',
        position: 'fixed',
        zIndex: 10,
      }}
      drag={isTopCard ? 'x' : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) < 50) return;
        const direction = info.offset.x > 0 ? 'like' : 'dislike';
        onSwipe(direction);
      }}
    >
      {/* Full-size invisible tap overlay for gallery cycling */}
      <div
        className="absolute inset-0 z-20"
        style={{cursor: 'pointer', pointerEvents: 'none', background: 'transparent'}}
        onClick={handleGalleryTap}
      />
      {/* Left/Right arrows for desktop */}
      {images?.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={e => { e.stopPropagation(); if (imgIdx > 0) setImgIdx(imgIdx - 1); }}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-12 h-12 items-center justify-center z-30"
            style={{pointerEvents: 'auto'}}
          >
            &#8592;
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={e => { e.stopPropagation(); if (imgIdx < images.length - 1) setImgIdx(imgIdx + 1); }}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-12 h-12 items-center justify-center z-30"
            style={{pointerEvents: 'auto'}}
          >
            &#8594;
          </button>
        </>
      )}
      {/* Glassmorphism Text box overlay - pointer-events-none so it doesn't block taps */}
      <div
        className="backdrop-blur"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 24,
          padding: 32,
          width: '100%',
          maxWidth: 540,
          margin: 40,
          pointerEvents: 'none',
          position: 'relative',
          border: '1.5px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18), 0 0 0 2px rgba(255,255,255,0.08)',
        }}
      >
        {/* Watchlist button */}
        <button
          onClick={handleWatchlist}
          className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-black/80 rounded-full p-2 pointer-events-auto"
          aria-label={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          style={{boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}}
        >
          {inWatchlist ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="#facc15" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#facc15" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.75.75 0 0 1 1.04 0l2.348 2.382 3.284.478a.75.75 0 0 1 .416 1.28l-2.377 2.32.561 3.27a.75.75 0 0 1-1.088.791L12 12.347l-2.94 1.543a.75.75 0 0 1-1.088-.79l.56-3.271-2.376-2.32a.75.75 0 0 1 .416-1.28l3.284-.478 2.348-2.382z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#facc15" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.75.75 0 0 1 1.04 0l2.348 2.382 3.284.478a.75.75 0 0 1 .416 1.28l-2.377 2.32.561 3.27a.75.75 0 0 1-1.088.791L12 12.347l-2.94 1.543a.75.75 0 0 1-1.088-.79l.56-3.271-2.376-2.32a.75.75 0 0 1 .416-1.28l3.284-.478 2.348-2.382z" />
            </svg>
          )}
        </button>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12}}>
          <h2 style={{fontSize: 36, fontWeight: 700, fontFamily: 'Montserrat, Playfair Display, serif', letterSpacing: 1}}>{title} <span style={{fontWeight: 'normal', fontSize: 26, opacity: 0.8}}>({year})</span></h2>
          {rating && (
            <span style={{background: '#222', color: 'gold', borderRadius: 8, padding: '4px 12px', fontWeight: 700, fontSize: 22, marginLeft: 8}}>
              ★ {rating.toFixed(1)}
            </span>
          )}
          <span className="ml-2 bg-blue-700 text-white text-xs font-bold rounded px-2 py-1 border border-white/20 shadow-lg" style={{marginLeft: 8, letterSpacing: 1, fontSize: 20, minWidth: 44, textAlign: 'center', display: 'inline-block'}}>
            {certDisplay}
          </span>
        </div>
        {/* Genres row */}
        {genres && genres.length > 0 && (
          <div className="flex flex-row flex-wrap gap-2 mb-2">
            {genres.map((g) => (
              <span key={g} className="bg-white/20 text-white text-xs font-semibold rounded-full px-3 py-1 border border-white/30 shadow-sm" style={{backdropFilter: 'blur(2px)'}}>
                {g}
              </span>
            ))}
          </div>
        )}
        <p style={{fontSize: 18, marginBottom: cast && cast.length ? 16 : 0}}>{description}</p>
        <div className="flex flex-row items-center gap-2 mt-2 overflow-x-auto">
          {cast && cast.length > 0 && (
            <div className="flex flex-row items-center gap-2">
              <span className="text-xs text-gray-200">Cast:</span>
              {cast.map((c) => (
                <span key={c.name} className="flex items-center gap-1">
                  {c.profile && (
                    <img src={c.profile} alt={c.name} className="h-6 w-6 rounded-full object-cover border border-white/30" />
                  )}
                  <span className="text-xs text-gray-300">{c.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Streaming Providers (ensure clickable) */}
        {providers && providers.length > 0 && (
          <div className="flex flex-row items-center gap-2 mt-2 z-30" style={{ pointerEvents: 'auto', position: 'relative' }}>
            <span className="text-xs text-gray-200">Available on:</span>
            {providers.map((p) => {
              let providerUrl = '';
              const providerName = p.name.toLowerCase();
              if (providerName.includes('netflix')) {
                providerUrl = 'https://www.netflix.com/';
              } else if (providerName.includes('prime') || providerName.includes('amazon')) {
                providerUrl = 'https://www.primevideo.com/';
              } else if (providerName.includes('disney')) {
                providerUrl = 'https://www.disneyplus.com/';
              } else if (providerName.includes('hotstar')) {
                providerUrl = 'https://www.hotstar.com/';
              } else if (providerName.includes('hulu')) {
                providerUrl = 'https://www.hulu.com/';
              } else if (providerName.includes('apple')) {
                providerUrl = 'https://tv.apple.com/';
              } else if (providerName.includes('zee5')) {
                providerUrl = 'https://www.zee5.com/';
              } else if (providerName.includes('jio')) {
                providerUrl = 'https://www.jiocinema.com/';
              } else if (providerName.includes('sony')) {
                providerUrl = 'https://www.sonyliv.com/';
              } else if (providerName.includes('paramount')) {
                providerUrl = 'https://www.paramountplus.com/';
              } else if (providerName.includes('discovery')) {
                providerUrl = 'https://www.discoveryplus.com/';
              } else if (providerName.includes('youtube')) {
                providerUrl = 'https://www.youtube.com/';
              } else {
                providerUrl = `https://www.google.com/search?q=${encodeURIComponent(p.name)}`;
              }
              return (
                <span key={p.name} className="flex items-center gap-1">
                  {p.logo ? (
                    <a
                      href={providerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Go to ${p.name}`}
                      onClick={e => e.stopPropagation()}
                    >
                      <img src={p.logo} alt={p.name} className="h-5 w-5 object-contain rounded bg-white/80 hover:scale-110 transition-transform" style={{cursor: 'pointer'}} />
                    </a>
                  ) : (
                    <a
                      href={providerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-300 hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      {p.name}
                    </a>
                  )}
                </span>
              );
            })}
        </div>
      )}
      </div>
    </div>
  );
}
