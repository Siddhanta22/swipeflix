// src/Recap.jsx
// A Spotify-Wrapped-inspired recap: a tappable sequence of full-screen,
// distinctly-colored story cards summarizing this session's swiping.
import { useState, useEffect, useMemo } from 'react';

const FALLBACK_IMAGE = 'https://placehold.co/800x1200/222/fff?text=No+Image';

function useCountUp(target, active, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    let start = null;
    let raf;
    const step = (ts) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

function getTopGenres(likedMovies, count = 3) {
  const tally = {};
  likedMovies.forEach((m) => {
    (m.genres || []).forEach((g) => {
      if (!g || g === 'Unknown') return;
      tally[g] = (tally[g] || 0) + 1;
    });
  });
  return Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([name]) => name);
}

function getArchetype(likedCount, dislikedCount, topGenre) {
  const total = likedCount + dislikedCount;
  const likeRate = total ? likedCount / total : 0;
  if (total === 0) {
    return { title: 'The Window Shopper', desc: "You browsed, but didn't commit to a single swipe yet." };
  }
  if (likeRate >= 0.75) {
    return { title: 'The Enthusiast', desc: `You liked ${Math.round(likeRate * 100)}% of everything you saw. Easy to please.` };
  }
  if (likeRate <= 0.2) {
    return { title: 'The Critic', desc: `Only ${Math.round(likeRate * 100)}% made the cut. Tough crowd.` };
  }
  if (topGenre) {
    return { title: `The ${topGenre} Loyalist`, desc: `${topGenre} kept showing up in your likes.` };
  }
  return { title: 'The Explorer', desc: 'Your taste ranged all over the map — no single genre dominated.' };
}

export default function Recap({ likedMovies, dislikedMovies, onClose, onRetakeQuiz }) {
  const [slideIdx, setSlideIdx] = useState(0);

  const total = likedMovies.length + dislikedMovies.length;
  const likeRate = total ? Math.round((likedMovies.length / total) * 100) : 0;
  const topGenres = useMemo(() => getTopGenres(likedMovies), [likedMovies]);
  const topPick = useMemo(() => {
    if (!likedMovies.length) return null;
    return [...likedMovies].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  }, [likedMovies]);
  const archetype = useMemo(
    () => getArchetype(likedMovies.length, dislikedMovies.length, topGenres[0]),
    [likedMovies, dislikedMovies, topGenres]
  );

  const slides = useMemo(() => {
    const s = [{ key: 'intro', bg: 'from-violet-700 via-fuchsia-600 to-pink-600' }];
    s.push({ key: 'split', bg: 'from-orange-500 via-red-500 to-pink-600' });
    if (topGenres.length) s.push({ key: 'genre', bg: 'from-teal-500 via-cyan-600 to-blue-700' });
    s.push({ key: 'archetype', bg: 'from-amber-400 via-orange-500 to-red-700' });
    if (topPick) s.push({ key: 'toppick', bg: null });
    s.push({ key: 'closing', bg: 'from-indigo-900 via-purple-900 to-black' });
    return s;
  }, [topGenres, topPick]);

  const safeIdx = Math.min(slideIdx, slides.length - 1);
  const current = slides[safeIdx];

  const goNext = () => setSlideIdx((s) => Math.min(s + 1, slides.length - 1));
  const goBack = () => setSlideIdx((s) => Math.max(s - 1, 0));

  const introCount = useCountUp(total, current.key === 'intro');
  const splitCount = useCountUp(likeRate, current.key === 'split');

  const topPickImg = topPick ? (Array.isArray(topPick.images) && topPick.images[0]) || FALLBACK_IMAGE : null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden select-none">
      {/* Story progress segments */}
      <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-30">
        {slides.map((s, i) => (
          <div key={s.key} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
            <div className={`h-full bg-white transition-all duration-300 ${i <= safeIdx ? 'w-full' : 'w-0'}`} />
          </div>
        ))}
      </div>
      <button onClick={onClose} aria-label="Close recap" className="absolute top-8 right-4 z-30 text-white/70 hover:text-white text-3xl leading-none">
        &times;
      </button>

      {/* Tap zones for navigation (sit below real interactive content) */}
      <button aria-label="Previous slide" onClick={goBack} className="absolute left-0 top-0 w-1/3 h-full z-10" />
      <button aria-label="Next slide" onClick={goNext} className="absolute right-0 top-0 w-1/3 h-full z-10" />

      <div
        key={current.key}
        className={`relative z-20 w-full h-full flex flex-col items-center justify-center text-center px-8 pointer-events-none animate-question-enter ${current.bg ? `bg-gradient-to-br ${current.bg}` : ''}`}
        style={
          current.key === 'toppick'
            ? {
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.35)), url(${topPickImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {current.key === 'intro' && (
          <>
            <p className="text-xl text-white/80 mb-4 font-semibold">Your SwipeFlix Recap</p>
            <div className="text-8xl md:text-9xl font-black text-white mb-4 tabular-nums">{introCount}</div>
            <p className="text-2xl text-white font-semibold">titles swiped through</p>
          </>
        )}

        {current.key === 'split' && (
          <>
            <div className="text-8xl md:text-9xl font-black text-white mb-2 tabular-nums">{splitCount}%</div>
            <p className="text-2xl text-white font-semibold mb-8">of what you saw got a like</p>
            <div className="flex gap-10 text-white">
              <div>
                <div className="text-4xl font-bold tabular-nums">{likedMovies.length}</div>
                <div className="text-sm uppercase tracking-wide text-white/70">Liked</div>
              </div>
              <div>
                <div className="text-4xl font-bold tabular-nums">{dislikedMovies.length}</div>
                <div className="text-sm uppercase tracking-wide text-white/70">Passed</div>
              </div>
            </div>
          </>
        )}

        {current.key === 'genre' && (
          <>
            <p className="text-xl text-white/80 mb-4 font-semibold">Your most-liked genre</p>
            <div className="text-5xl md:text-6xl font-black text-white mb-6">{topGenres[0]}</div>
            {topGenres.length > 1 && (
              <p className="text-white/85 text-lg">Also big on {topGenres.slice(1).join(' & ')}</p>
            )}
          </>
        )}

        {current.key === 'archetype' && (
          <>
            <p className="text-xl text-white/80 mb-4 font-semibold">Your SwipeFlix type is...</p>
            <div className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">{archetype.title}</div>
            <p className="text-lg text-white/90 max-w-sm">{archetype.desc}</p>
          </>
        )}

        {current.key === 'toppick' && topPick && (
          <>
            <p className="text-xl text-white/80 mb-4 font-semibold">Your top pick</p>
            <div className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">{topPick.title}</div>
            {topPick.rating && (
              <div className="text-yellow-400 text-2xl font-bold">★ {topPick.rating.toFixed(1)}</div>
            )}
          </>
        )}

        {current.key === 'closing' && (
          <>
            <div className="text-6xl mb-4">🍿</div>
            <p className="text-3xl font-black text-white mb-8">That's a wrap!</p>
            <div className="relative z-30 flex gap-3 pointer-events-auto">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition"
              >
                Keep Swiping
              </button>
              <button
                onClick={onRetakeQuiz}
                className="px-6 py-3 rounded-full bg-white text-purple-900 font-bold transition hover:scale-105"
              >
                Retake Quiz
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
