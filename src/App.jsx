// src/App.js
import { useState, useEffect, useRef } from 'react';
import QuizFlow from './quizflow';
import SwipeCard from './SwipeCard';
import { getWatchlist, removeFromWatchlist } from './storage';
import FloatingIcons from './FloatingIcons';
import PlatformLogo from './PlatformLogos';
import Recap from './Recap';

const TMDB = 'https://api.themoviedb.org/3';
const FALLBACK = 'https://placehold.co/800x1200/222/fff?text=No+Image';

// Fetch full details (images, cast, streaming providers) for a movie/show
async function fetchMovieDetails(item, mediaType, key) {
  const images = await fetch(`${TMDB}/${mediaType}/${item.id}/images?api_key=${key}`)
    .then((r) => r.json())
    .then((x) =>
      [
        ...(x.backdrops || []).map((b) => b.file_path),
        ...(x.posters || []).map((p) => p.file_path),
      ]
        .slice(0, 6)
        .map((p) => `https://image.tmdb.org/t/p/original${p}`)
    )
    .then((imgs) => (imgs.length ? imgs : [FALLBACK]))
    .catch(() => [FALLBACK]);

  const credits = await fetch(`${TMDB}/${mediaType}/${item.id}/credits?api_key=${key}`)
    .then((r) => r.json())
    .catch(() => ({ cast: [] }));
  const cast = Array.isArray(credits.cast)
    ? credits.cast.slice(0, 5).map((actor) => ({
        name: actor.name,
        profile: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null,
      }))
    : [];

  const providersData = await fetch(`${TMDB}/${mediaType}/${item.id}/watch/providers?api_key=${key}`)
    .then((r) => r.json())
    .catch(() => ({}));
  const usProviders = providersData.results?.US?.flatrate
    ? providersData.results.US.flatrate.map((p) => ({
        name: p.provider_name,
        logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null,
      }))
    : [];

  return {
    id: item.id,
    title: item.title || item.name || 'Untitled',
    year: (item.release_date || item.first_air_date || '').split('-')[0] || '',
    description: item.overview || 'No description',
    images,
    rating: item.vote_average || null,
    cast,
    providers: usProviders,
    certification: item.certification || '',
    genres: item.genres || [],
    media_type: mediaType,
    popularity: item.popularity || 0,
    vote_average: item.vote_average || 0,
  };
}

// Matches the streaming services offered in the onboarding quiz
const PLATFORM_OPTIONS = [
  { key: 'netflix', label: 'Netflix' },
  { key: 'prime', label: 'Prime Video' },
  { key: 'disney', label: 'Disney+' },
  { key: 'hulu', label: 'Hulu' },
  { key: 'apple', label: 'Apple TV+' },
  { key: 'paramount', label: 'Paramount+' },
];

// TMDB's language list has ~180 entries (most irrelevant to a movie-discovery
// filter); trim to languages users are actually likely to filter by.
const COMMON_LANGUAGE_CODES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'hi', 'ar', 'ru', 'tr', 'th', 'ta', 'te'];

export default function App() {
  const [showQuiz, setShowQuiz] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'movie', 'tv'
  const [minRating, setMinRating] = useState(0);
  const [seenIds, setSeenIds] = useState(new Set());
  const [pendingResults, setPendingResults] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [likedMovies, setLikedMovies] = useState([]);
  const [dislikedMovies, setDislikedMovies] = useState([]);
  const [showRecap, setShowRecap] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [languages, setLanguages] = useState([]);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [watchlist, setWatchlist] = useState(getWatchlist());
  // Age-rating groups: merges the overlapping movie/TV codes TMDB uses
  // (e.g. G and TV-G) into one meaningful choice instead of listing both.
  const [selectedCertification, setSelectedCertification] = useState([]);
  const certificationsList = [
    { value: [], label: 'All Ratings' },
    { value: ['G', 'TV-Y', 'TV-Y7', 'TV-G'], label: 'Kids' },
    { value: ['PG', 'TV-PG'], label: 'Family' },
    { value: ['PG-13', 'TV-14'], label: 'Teen' },
    { value: ['R', 'NC-17', 'TV-MA'], label: 'Mature' },
  ];
  const [showHome, setShowHome] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [swipeOut, setSwipeOut] = useState(false); // for swiping animation
  const homeCardRef = useRef(null);
  const swipeCardRef = useRef(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [languageQuery, setLanguageQuery] = useState('');
  const [similarMovies, setSimilarMovies] = useState([]);
  const [showSimilarMovies, setShowSimilarMovies] = useState(false);

  // Initialization Effect
  useEffect(() => {
    const key = import.meta.env.VITE_TMDB_API_KEY;
    if (!key) {
      setError('Missing TMDB API key. Please check your environment variables.');
    }
    setIsInitialized(true);
  }, []);

  const handleQuizComplete = (answers) => {
    setQuizAnswers(answers);
    if (Array.isArray(answers.platforms) && answers.platforms.length > 0) {
      setSelectedPlatforms(answers.platforms);
    }
    setShowQuiz(false);
    setIsLoading(true); // Immediately enter loading state
    setLikedMovies([]);
    setDislikedMovies([]);
  };

  const handleSwipe = (movie, preference) => {
    if (preference === 'like') {
      setLikedMovies(prev => [...prev, movie]);
      // Fetch similar movies when user likes a movie
      if (movie.id && movie.media_type) {
        fetchSimilarMovies(movie.id, movie.media_type);
      }
    } else {
      setDislikedMovies(prev => [...prev, movie]);
    }
    // Advance to next card from pendingResults
    const nextIdx = pendingResults.findIndex(m => m.id === movie.id) + 1;
    const next = pendingResults.slice(nextIdx).find(m => !seenIds.has(m.id));
    if (next) {
      // Fetch details for this movie
      (async () => {
        const key = import.meta.env.VITE_TMDB_API_KEY;
        const shaped = await fetchMovieDetails(next, next.media_type, key);
        setCurrentCard(shaped);
        setImgIdx(0);
        addSeenIds([next.id]);
      })();
    } else {
      setCurrentCard(null);
    }
  };

  useEffect(() => {
    const key = import.meta.env.VITE_TMDB_API_KEY;
    if (!key) return;
    fetch(`${TMDB}/genre/movie/list?api_key=${key}`)
      .then(r => r.json())
      .then(d => setGenres(d.genres || []))
      .catch(() => setGenres([]));
  }, []);

  // Fetch available languages from TMDB, trimmed to a commonly-useful subset
  useEffect(() => {
    const key = import.meta.env.VITE_TMDB_API_KEY;
    if (!key) return;
    fetch(`${TMDB}/configuration/languages?api_key=${key}`)
      .then(r => r.json())
      .then(d => setLanguages(Array.isArray(d) ? d.filter(l => COMMON_LANGUAGE_CODES.includes(l.iso_639_1)) : []))
      .catch(() => setLanguages([]));
  }, []);

  // Helper to shuffle an array
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Map quiz answers to preferred genres. The "mood" and "genre" questions
  // answer with option keys that map directly onto TMDB genre names.
  function getPreferredGenresFromQuiz(quizAnswers) {
    if (!quizAnswers) return [];
    const mapping = {
      action: 'Action',
      romance: 'Romance',
      'sci-fi': 'Science Fiction',
      comedy: 'Comedy',
      horror: 'Horror',
      drama: 'Drama',
    };
    return [quizAnswers.mood, quizAnswers.genre]
      .map((key) => mapping[key])
      .filter(Boolean);
  }

  // Score a result for sorting, biasing towards quiz-preferred genres and the
  // "experience"/"binge" answers so every quiz question actually affects results.
  function computeQuizScore(m, quizAnswers, preferredGenres) {
    let score = (m.vote_average || 0) * (m.popularity || 1);
    if (preferredGenres.length > 0 && m.genres?.some(g => preferredGenres.includes(g))) {
      score *= 1.5;
    }
    const experience = quizAnswers?.experience;
    if (experience === 'hidden-gems') {
      // Favor well-rated titles that aren't already massively popular.
      score = (m.vote_average || 0) * 100 - (m.popularity || 0);
    } else if (experience === 'classics') {
      const year = parseInt((m.release_date || m.first_air_date || '').slice(0, 4), 10);
      if (year) score += (new Date().getFullYear() - year) * 5;
    } else if (experience === 'trending') {
      score *= 1.2;
    }
    if (quizAnswers?.binge === 'binge' && m.media_type === 'tv') {
      score *= 1.15;
    }
    return score;
  }

  useEffect(() => {
    if (showQuiz) return;
    const key = import.meta.env.VITE_TMDB_API_KEY;
    if (!key) {
      setError('Missing TMDB API key. Please check your environment variables.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSeenIds(new Set());
    setPendingResults([]);
    setCurrentCard(null);

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setError('Request timed out. Please check your internet connection and try again.');
        setIsLoading(false);
      }
    }, 30000); // 30 second timeout
    
    const fetchInitial = async () => {
      const key = import.meta.env.VITE_TMDB_API_KEY;
      let results = [];
      let movieUrl = '';
      let tvUrl = '';

      try {
      // If language is selected, always use discover endpoints
      if (selectedLanguage) {
        if (selectedType === 'all') {
          movieUrl = `${TMDB}/discover/movie?api_key=${key}&with_original_language=${selectedLanguage}`;
          tvUrl = `${TMDB}/discover/tv?api_key=${key}&with_original_language=${selectedLanguage}`;
          // Add genre if selected
          if (selectedGenre) {
            movieUrl += `&with_genres=${selectedGenre}`;
            tvUrl += `&with_genres=${selectedGenre}`;
          }
          // Fetch both and merge
          const [movieResults, tvResults] = await Promise.all([
            fetchMoreResults(movieUrl, 1, 3),
            fetchMoreResults(tvUrl, 1, 3)
          ]);
          results = [
            ...movieResults.map(m => ({ ...m, media_type: 'movie' })),
            ...tvResults.map(m => ({ ...m, media_type: 'tv' })),
          ];
        } else if (selectedType === 'movie') {
          movieUrl = `${TMDB}/discover/movie?api_key=${key}&with_original_language=${selectedLanguage}`;
          if (selectedGenre) movieUrl += `&with_genres=${selectedGenre}`;
          results = await fetchMoreResults(movieUrl, 1, 5);
          results = results.map(m => ({ ...m, media_type: 'movie' }));
        } else if (selectedType === 'tv') {
          tvUrl = `${TMDB}/discover/tv?api_key=${key}&with_original_language=${selectedLanguage}`;
          if (selectedGenre) tvUrl += `&with_genres=${selectedGenre}`;
          results = await fetchMoreResults(tvUrl, 1, 5);
          results = results.map(m => ({ ...m, media_type: 'tv' }));
        }
      } else {
        // No language filter: use multiple sources for variety
        
        // Fetch from multiple sources for variety
        const sources = [
          `${TMDB}/trending/all/week?api_key=${key}`,
          `${TMDB}/movie/popular?api_key=${key}`,
          `${TMDB}/tv/popular?api_key=${key}`,
          `${TMDB}/movie/top_rated?api_key=${key}`,
          `${TMDB}/tv/top_rated?api_key=${key}`
        ];
        
        // If genre is selected, use discover endpoints
    if (selectedGenre) {
          results = await fetchMoreResults(`${TMDB}/discover/movie?api_key=${key}&with_genres=${selectedGenre}`, 1, 3);
          results = results.map(m => ({ ...m, media_type: 'movie' }));
        } else {
          // Fetch from multiple sources and combine
          const allResults = await Promise.all(
            sources.map(url => fetchMoreResults(url, Math.floor(Math.random() * 10) + 1, 2))
          );
          results = allResults.flat();
        }
        
        // Ensure we have a mix of movies and TV shows
        if (selectedType === 'all') {
          results = results.filter(m => m.media_type === 'movie' || m.media_type === 'tv');
        } else if (selectedType === 'movie') {
          results = results.filter(m => m.media_type === 'movie' || !m.media_type);
          results = results.map(m => ({ ...m, media_type: 'movie' }));
        } else if (selectedType === 'tv') {
          results = results.filter(m => m.media_type === 'tv');
        }
      }
      // Dedupe by TMDB id *before* the expensive per-title lookups below —
      // the same title often shows up in multiple source lists (trending,
      // popular, top-rated), and fetching its certification/providers twice
      // is pure waste.
      const seenResultIds = new Set();
      const dedupedResults = [];
      for (const m of results) {
        if (!seenResultIds.has(m.id)) {
          seenResultIds.add(m.id);
          dedupedResults.push(m);
        }
      }
      // Apply the filters that don't need extra API calls (release date,
      // min rating — both already present on the raw TMDB result) before
      // the per-title fetch, so we're not fetching certification/providers
      // for titles we're about to throw away anyway.
      const now = new Date();
      const cheapFiltered = dedupedResults.filter(m => {
        const releaseDate = new Date(m.release_date || m.first_air_date || '1900-01-01');
        if (releaseDate > now) return false;
        if (minRating > 0 && (m.vote_average || 0) < minRating) return false;
        return true;
      });
      // Fetch certifications and providers only for titles that survived the cheap filters above
      const withCertsAndProviders = await Promise.all(cheapFiltered.map(async (m) => {
        let certification = '';
        try {
          if (m.media_type === 'movie') {
            const certData = await fetch(`${TMDB}/movie/${m.id}/release_dates?api_key=${key}`).then(r => r.json());
            const us = certData.results?.find(r => r.iso_3166_1 === 'US');
            if (us && Array.isArray(us.release_dates)) {
              const theatrical = us.release_dates.find(d => d.certification && d.type === 3);
              const anyCert = us.release_dates.find(d => d.certification);
              certification = (theatrical || anyCert)?.certification || '';
            }
          } else if (m.media_type === 'tv') {
            const certData = await fetch(`${TMDB}/tv/${m.id}/content_ratings?api_key=${key}`).then(r => r.json());
            const us = certData.results?.find(r => r.iso_3166_1 === 'US');
            certification = us?.rating || '';
          }
        } catch {
          // No certification data available for this title; leave blank.
        }
        let genresArr = [];
        if (Array.isArray(m.genre_ids) && genres.length > 0) {
          genresArr = m.genre_ids.map(id => genres.find(g => g.id === id)?.name).filter(Boolean);
        } else if (Array.isArray(m.genres) && m.genres.length > 0) {
          genresArr = m.genres.map(g => g.name);
        }
        if (!genresArr.length && Array.isArray(m.genre_ids)) {
          genresArr = m.genre_ids.map(String);
        }
        if (genresArr.length === 0) {
          genresArr = ['Unknown'];
        }
        // Fetch streaming providers
        let usProviders = [];
        try {
          const providersData = await fetch(`${TMDB}/${m.media_type}/${m.id}/watch/providers?api_key=${key}`).then((r) => r.json());
          usProviders = providersData.results && providersData.results.US && providersData.results.US.flatrate
            ? providersData.results.US.flatrate.map(p => ({
                name: p.provider_name,
                logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null
              }))
            : [];
        } catch {
          // No provider data available for this title; leave empty.
        }
        return { ...m, certification, genres: genresArr, providers: usProviders };
      }));
      // Only include titles with streaming providers, meeting the
      // age-certification filter (release date and min rating were already
      // applied above, before the per-title fetch)
      const filtered = withCertsAndProviders.filter(m => {
        if (!m.providers || !Array.isArray(m.providers) || m.providers.length === 0) return false;
        if (selectedCertification.length > 0 && !selectedCertification.includes(m.certification)) return false;
        return true;
      });
      // Filter by selected streaming platforms
      let filteredByPlatform = filtered;
      if (selectedPlatforms.length > 0) {
        filteredByPlatform = filtered.filter(m =>
          m.providers && m.providers.some(p =>
            selectedPlatforms.some(sel => p.name.toLowerCase().includes(sel))
          )
        );
      }
      // Sort by a quiz-aware score (popularity/rating, genre match, experience, binge style)
      const preferredGenres = getPreferredGenresFromQuiz(quizAnswers);
      filteredByPlatform.sort((a, b) =>
        computeQuizScore(b, quizAnswers, preferredGenres) - computeQuizScore(a, quizAnswers, preferredGenres)
      );
      // (already deduped by id before the expensive per-title fetch, above)
      setPendingResults(shuffleArray(filteredByPlatform));
      setHasInitiallyLoaded(true);
      setIsLoading(false);
      clearTimeout(timeoutId); // Clear timeout on success
      } catch (error) {
        console.error('Error fetching movies:', error);
        setError(`Failed to fetch movies: ${error.message}`);
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    };
    
    // Add error handling to fetchInitial
    fetchInitial().catch((error) => {
      console.error('Error fetching movies:', error);
      setError('Failed to fetch movies. Please check your internet connection and try again.');
      setIsLoading(false);
      clearTimeout(timeoutId); // Clear timeout on error
    });
  }, [showQuiz, selectedGenre, selectedType, minRating, selectedLanguage, selectedCertification, selectedPlatforms, quizAnswers]);

  // When pendingResults or seenIds change, load the first card if needed
  useEffect(() => {
    if (!currentCard && pendingResults.length > 0) {
      const next = pendingResults.find(m => !seenIds.has(m.id));
      if (next) {
        (async () => {
          const key = import.meta.env.VITE_TMDB_API_KEY;
          const shaped = await fetchMovieDetails(next, next.media_type, key);
          setCurrentCard(shaped);
          setImgIdx(0);
          addSeenIds([next.id]);
        })();
      }
    }
  }, [pendingResults, seenIds]);

  // Helper to add IDs to seen set
  const addSeenIds = (ids) => setSeenIds(prev => new Set([...prev, ...ids]));

  // Progressive fetch function
  const fetchMoreResults = async (baseUrl, startPage, pages = 5) => {
    let allResults = [];
    for (let page = startPage; page < startPage + pages; page++) {
      const pageUrl = baseUrl + `&page=${page}`;
      const resp = await fetch(pageUrl);
      if (!resp.ok) break;
      const data = await resp.json();
      if (Array.isArray(data.results)) {
        allResults = allResults.concat(data.results);
      }
      if (data.page >= data.total_pages) break;
    }
    return allResults;
  };

  // On first mount, ensure we start with All Genres and not loaded
  // (prevents stuck on empty state)
  // Only run once
  useEffect(() => {
    if (!hasInitiallyLoaded && selectedGenre !== '') {
      setSelectedGenre('');
    }
    // eslint-disable-next-line
  }, []);

  // Keep watchlist in sync
  useEffect(() => {
    if (showWatchlist) setWatchlist(getWatchlist());
  }, [showWatchlist]);

  const handleRemoveFromWatchlist = (id) => {
    removeFromWatchlist(id);
    setWatchlist(getWatchlist());
  };

  // Fetch similar movies based on liked movies
  const fetchSimilarMovies = async (movieId, mediaType = 'movie') => {
    try {
      const key = import.meta.env.VITE_TMDB_API_KEY;
      const response = await fetch(`${TMDB}/${mediaType}/${movieId}/similar?api_key=${key}`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Process similar movies with full details
        const processedSimilar = await Promise.all(
          data.results.slice(0, 10).map((movie) => fetchMovieDetails(movie, mediaType, key))
        );

        setSimilarMovies(processedSimilar);
        setShowSimilarMovies(true);
      }
    } catch (error) {
      console.error('Error fetching similar movies:', error);
    }
  };

  // Helper to load a card by ID (from watchlist)
  const loadCardById = async (id) => {
    const item = watchlist.find(m => m.id === id);
    if (!item) return;
    // If item has all details, use it; else fetch details
    if (item.images && item.cast && item.providers) {
      setCurrentCard(item);
      setImgIdx(0);
      setShowWatchlist(false);
      addSeenIds([item.id]);
      return;
    }
    // Fetch details if missing
    const key = import.meta.env.VITE_TMDB_API_KEY;
    const mediaType = item.media_type || 'movie';
    const shaped = { ...item, ...(await fetchMovieDetails(item, mediaType, key)) };
    setCurrentCard(shaped);
    setImgIdx(0);
    setShowWatchlist(false);
    addSeenIds([item.id]);
  };

  function togglePlatform(key) {
    setSelectedPlatforms(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  }

  // Add a reset filters handler
  function handleResetFilters() {
    setSelectedGenre('');
    setSelectedType('all');
    setMinRating(0);
    setSelectedLanguage('');
    setLanguageQuery('');
    setSelectedCertification([]);
    setSelectedPlatforms([]);
  }

  const activeFilterCount =
    (minRating > 0 ? 1 : 0) +
    (selectedCertification.length > 0 ? 1 : 0) +
    (selectedLanguage ? 1 : 0) +
    (selectedGenre ? 1 : 0) +
    (selectedPlatforms.length > 0 ? 1 : 0);
  
  // --- Conditional Rendering Logic ---

  if (showIntro) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
        <div
          className="absolute w-96 h-96 rounded-full animate-intro-glow"
          style={{ background: 'radial-gradient(circle, #6c3fa7 0%, transparent 70%)' }}
        />
        <div className="relative flex flex-col items-center animate-logo-zoom">
          <SwipeCardLogo size={72} />
          <span
            className="mt-4 text-4xl font-black text-white"
            style={{ fontFamily: 'Fredoka, Baloo 2, Montserrat, sans-serif', letterSpacing: 1 }}
          >
            SwipeFlix
          </span>
        </div>
      </div>
    );
  }

  if (showHome) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden animate-gradient-pan" style={{
        backgroundImage: 'linear-gradient(135deg, #232946 0%, #6c3fa7 100%)',
      }}>
        {/* Floating ambient icons */}
        <FloatingIcons />
        {/* Elegant glass card */}
        <div
          ref={homeCardRef}
          className={`backdrop-blur-lg bg-white/15 rounded-3xl shadow-2xl px-8 py-12 md:px-16 md:py-16 flex flex-col items-center animate-fade-in transition-transform duration-700 hover:scale-105 ${swipeOut ? 'swipe-out' : ''}`}
          style={{maxWidth: 420, border: '2px solid #fff4', boxShadow: '0 8px 48px #23294644'}}
        >
          {/* Swipe card logo above SwipeFlix */}
          <span className="block mb-4" style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
          }}>
            <SwipeCardLogo />
          </span>
          <span className="block mb-4" style={{
            fontFamily: 'Fredoka, Baloo 2, Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: 54,
            letterSpacing: 1,
            color: '#fff',
            textShadow: '0 2px 12px #6c3fa7, 0 1px 0 #fff2',
            filter: 'drop-shadow(0 0 8px #232946cc)',
            position: 'relative',
            zIndex: 1,
            lineHeight: 1.1,
          }}>
            SwipeFlix
          </span>
          <div className="text-xl font-semibold mb-6 animate-fade-in-slow" style={{letterSpacing: 1, textShadow: '0 2px 8px #232946', color: '#f3f3f3'}}>
            Swipe right for a good time.
          </div>
          <button
            onClick={() => {
              setSwipeOut(true);
              setTimeout(() => {
                setShowIntro(true);
                setTimeout(() => {
                  setShowHome(false);
                  setShowIntro(false);
                }, 900);
              }, 650);
            }}
            className="px-10 py-4 rounded-full font-extrabold text-xl shadow-xl transition-transform animate-fade-in border-2 border-white/30 glassy-swipe-btn animate-pulse"
            style={{
              background: 'rgba(44, 44, 84, 0.45)',
              color: '#fff',
              letterSpacing: 1,
              boxShadow: '0 2px 24px #6c3fa755, 0 1.5px 0 #fff2',
              backdropFilter: 'blur(8px)',
              textShadow: '0 1px 0 #232946',
              border: '2px solid #fff4',
            }}
          >
            🎬 Start Swiping
          </button>
        </div>
        {/* Vignette overlay for depth */}
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0.0) 60%, #000 100%)',
          zIndex: 2,
        }} />
      </div>
    );
  }
  
  // Initializing Loading State
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-white rounded-full mb-4"/>
        <p className="text-lg">Initializing SwipeFlix...</p>
      </div>
    );
  }

  // API Key Error Message Enhancement
  if (error) {
     return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">🚨 SwipeFlix Error</h1>
        <p className="text-red-400 mb-4">Error: {error}</p>
        {error.includes('API key') && (
          <div className="bg-gray-800 p-4 rounded-lg mb-4 max-w-md">
            <p className="text-sm text-gray-300 mb-2">To fix this:</p>
            <ol className="text-sm text-gray-300 text-left">
              <li>1. Go to your Vercel dashboard</li>
              <li>2. Select this project</li>
              <li>3. Go to Settings → Environment Variables</li>
              <li>4. Add VITE_TMDB_API_KEY with your TMDB API key</li>
            </ol>
          </div>
        )}
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white">Retry</button>
      </div>
    );
  }
  
  // Show demo mode if no API key
  if (!import.meta.env.VITE_TMDB_API_KEY) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">🎬 SwipeFlix Demo Mode</h1>
        <p className="text-gray-300 mb-4">API key not configured. Running in demo mode.</p>
        <div className="bg-gray-800 p-6 rounded-lg mb-4 max-w-md">
          <p className="text-sm text-gray-300 mb-2">To enable full functionality:</p>
          <ol className="text-sm text-gray-300 text-left">
            <li>1. Get a free API key from <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">TMDB</a></li>
            <li>2. Go to your Vercel dashboard</li>
            <li>3. Go to Settings → Environment Variables</li>
            <li>4. Add VITE_TMDB_API_KEY with your API key</li>
          </ol>
        </div>
        <button onClick={() => setShowQuiz(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white">Try Demo Quiz</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white animate-gradient-pan">
      
      {/* Rest of the app */}
      {showQuiz ? (
        <QuizFlow onComplete={handleQuizComplete} />
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="animate-pulse">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🎬</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Finding Your Perfect Matches...
            </h1>
            <p className="text-gray-300 text-lg">Discovering movies &amp; shows just for you</p>
            <div className="flex space-x-2 justify-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col items-center justify-center">
      {/* Top bar: Type toggle + single Filters entry point */}
      <div className="fixed top-0 left-0 w-full z-50 flex flex-row items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-black/80 to-purple-900/80 backdrop-blur-md border-b border-purple-500/30">
        <div className="flex items-center gap-1">
          <button onClick={() => setSelectedType('all')} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${selectedType==='all' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-200 hover:bg-white/20'}`}>All</button>
          <button onClick={() => setSelectedType('movie')} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${selectedType==='movie' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-200 hover:bg-white/20'}`}>Movies</button>
          <button onClick={() => setSelectedType('tv')} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${selectedType==='tv' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-200 hover:bg-white/20'}`}>TV Shows</button>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button onClick={handleResetFilters} className="text-xs text-gray-300 hover:text-white underline transition">
              Reset
            </button>
          )}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 border transition ${showFilters || activeFilterCount > 0 ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/10 text-gray-200 border-white/20 hover:bg-white/20'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-yellow-400 text-black text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Consolidated filter panel */}
      {showFilters && (
        <div className="fixed top-16 right-4 z-50 w-[90vw] max-w-[380px] max-h-[80vh] overflow-y-auto bg-zinc-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-5 space-y-5">
          {/* Min Rating */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-200">Min Rating</span>
              <span className="text-sm text-yellow-400 font-bold">{minRating > 0 ? `${minRating}+` : 'Any'}</span>
            </div>
            <input
              type="range" min="0" max="10" step="0.5" value={minRating}
              onChange={e => setMinRating(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Age Rating */}
          <div>
            <span className="text-sm font-semibold text-gray-200 block mb-2">Age Rating</span>
            <div className="flex flex-wrap gap-2">
              {certificationsList.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setSelectedCertification(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${selectedCertification === opt.value ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/10 text-gray-200 border-white/20 hover:bg-white/20'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre */}
          <div>
            <span className="text-sm font-semibold text-gray-200 block mb-2">Genre</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setHasInitiallyLoaded(false); setSelectedGenre(''); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${selectedGenre === '' ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/10 text-gray-200 border-white/20 hover:bg-white/20'}`}
              >
                All
              </button>
              {genres.map(g => (
                <button
                  key={g.id}
                  onClick={() => { setHasInitiallyLoaded(false); setSelectedGenre(String(g.id)); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${selectedGenre === String(g.id) ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/10 text-gray-200 border-white/20 hover:bg-white/20'}`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <span className="text-sm font-semibold text-gray-200 block mb-2">Language</span>
            <input
              type="text"
              placeholder="Search language..."
              value={languageQuery}
              onChange={e => setLanguageQuery(e.target.value)}
              className="w-full mb-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            />
            <div className="max-h-32 overflow-y-auto flex flex-col gap-1 pr-1">
              <button
                onClick={() => setSelectedLanguage('')}
                className={`text-left px-3 py-1.5 rounded-lg text-sm transition ${selectedLanguage === '' ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-white/10'}`}
              >
                All Languages
              </button>
              {languages
                .filter(lang => lang.english_name.toLowerCase().includes(languageQuery.toLowerCase()))
                .sort((a, b) => a.english_name.localeCompare(b.english_name))
                .map(lang => (
                  <button
                    key={lang.iso_639_1}
                    onClick={() => setSelectedLanguage(lang.iso_639_1)}
                    className={`text-left px-3 py-1.5 rounded-lg text-sm transition ${selectedLanguage === lang.iso_639_1 ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-white/10'}`}
                  >
                    {lang.english_name}
                  </button>
                ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <span className="text-sm font-semibold text-gray-200 block mb-2">Streaming On</span>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORM_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => togglePlatform(opt.key)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition ${selectedPlatforms.includes(opt.key) ? 'border-white bg-white/10' : 'border-white/10 hover:bg-white/5'}`}
                >
                  <PlatformLogo id={opt.key} size={32} />
                  <span className="text-[11px] text-gray-300 text-center leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center w-full h-full flex-1 relative" style={{minHeight: '100vh'}}>
        {currentCard ? (
          <>
            <SwipeCard
              ref={swipeCardRef}
              key={currentCard.id}
              movie={currentCard}
              isTopCard={true}
              onSwipe={(preference) => handleSwipe(currentCard, preference)}
              imgIdx={imgIdx}
              setImgIdx={setImgIdx}
            />
            {/* Primary swipe actions - front and center, but light enough not to bury content */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-10 z-50">
              <button
                onClick={() => swipeCardRef.current?.swipe('dislike')}
                className="w-14 h-14 rounded-full bg-red-500/80 flex items-center justify-center shadow-md hover:bg-red-500 transition-all duration-200 transform hover:scale-110 border-2 border-white/25 backdrop-blur-md"
                aria-label="Dislike"
                style={{boxShadow: '0 4px 16px rgba(239, 68, 68, 0.25)'}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>

              <button
                onClick={() => swipeCardRef.current?.swipe('like')}
                className="w-14 h-14 rounded-full bg-green-500/80 flex items-center justify-center shadow-md hover:bg-green-500 transition-all duration-200 transform hover:scale-110 border-2 border-white/25 backdrop-blur-md"
                aria-label="Like"
                style={{boxShadow: '0 4px 16px rgba(34, 197, 94, 0.25)'}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                  <path d="M12 21s-6.7-4.35-9.3-8.1C.8 10.1 1.2 6.6 4 4.9c2.2-1.3 4.6-.6 6 1.1l2 2.3 2-2.3c1.4-1.7 3.8-2.4 6-1.1 2.8 1.7 3.2 5.2 1.3 8-2.6 3.75-9.3 8.1-9.3 8.1z" />
                </svg>
              </button>
            </div>
            {/* Secondary actions - smaller, on the opposite side from the Filters panel */}
            <div className="fixed top-20 left-4 flex flex-col gap-3 z-50">
              <button
                onClick={() => setShowWatchlist(true)}
                className="w-12 h-12 rounded-full bg-amber-500/90 hover:bg-amber-500 flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-110 border-2 border-white/20 backdrop-blur-sm"
                aria-label="My Watchlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M4 6h16M4 12h10M4 18h6" />
                </svg>
              </button>
              <button
                onClick={() => fetchSimilarMovies(currentCard.id, currentCard.media_type)}
                className="w-12 h-12 rounded-full bg-violet-600/90 hover:bg-violet-600 flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-110 border-2 border-white/20 backdrop-blur-sm"
                aria-label="Similar Movies"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" />
                  <line x1="15" y1="15" x2="21" y2="21" />
                  <line x1="4" y1="4" x2="9" y2="9" />
                </svg>
              </button>
              <button
                onClick={() => setShowRecap(true)}
                className="w-12 h-12 rounded-full bg-pink-600/90 hover:bg-pink-600 flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-110 border-2 border-white/20 backdrop-blur-sm"
                aria-label="My Recap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <line x1="6" y1="20" x2="6" y2="12" />
                  <line x1="12" y1="20" x2="12" y2="6" />
                  <line x1="18" y1="20" x2="18" y2="14" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center px-6 animate-fade-in">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold mb-2">You've seen it all!</h2>
            <p className="text-gray-400 mb-6 max-w-sm">
              No more movies match your current filters. Loosen them up or retake the quiz for a fresh set of picks.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => setShowRecap(true)}
                className="px-5 py-3 rounded-full bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white font-semibold transition"
              >
                See My Recap
              </button>
              <button
                onClick={handleResetFilters}
                className="px-5 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
              >
                Reset Filters
              </button>
              <button
                onClick={() => { setQuizAnswers(null); setShowQuiz(true); }}
                className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition"
              >
                Retake Quiz
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Watchlist Modal */}
      {showWatchlist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur" style={{animation: 'fadeIn 0.2s'}}>
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto relative border border-purple-500/20">
            <button
              onClick={() => setShowWatchlist(false)}
              className="absolute top-3 right-3 text-white/70 hover:text-white text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">⭐ My Watchlist</h2>
            {watchlist.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📺</div>
                <p className="text-gray-400 text-lg">Your watchlist is empty.</p>
                <p className="text-gray-500 text-sm mt-2">Start swiping to add titles!</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {watchlist.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-lg p-3 cursor-pointer hover:from-zinc-700 hover:to-zinc-600 transition-all duration-200 transform hover:scale-105 border border-zinc-600/50"
                    onClick={() => loadCardById(item.id)}
                  >
                    <img src={item.images?.[0] || 'https://placehold.co/80x120/222/fff?text=No+Image'} alt={item.title} className="w-14 h-20 object-cover rounded-lg border border-zinc-700" />
                    <div className="flex-1">
                      <div className="font-semibold text-white">{item.title} <span className="text-gray-400 text-xs">({item.year})</span></div>
                      <div className="text-xs text-gray-400 line-clamp-2">{item.description}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveFromWatchlist(item.id); }}
                      className="ml-2 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
        </div>
      )}

      {/* Similar Movies Modal */}
      {showSimilarMovies && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur" style={{animation: 'fadeIn 0.2s'}}>
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto relative border border-purple-500/20">
            <button
              onClick={() => setShowSimilarMovies(false)}
              className="absolute top-3 right-3 text-white/70 hover:text-white text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent mb-4">🔄 Similar Movies</h2>
            {similarMovies.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎬</div>
                <p className="text-gray-400 text-lg">Finding similar titles...</p>
                <p className="text-gray-500 text-sm mt-2">This may take a moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {similarMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-lg p-3 cursor-pointer hover:from-zinc-700 hover:to-zinc-600 transition-all duration-200 transform hover:scale-105 border border-zinc-600/50"
                    onClick={() => {
                      setCurrentCard(movie);
                      setImgIdx(0);
                      setShowSimilarMovies(false);
                      addSeenIds([movie.id]);
                    }}
                  >
                    <img src={movie.images?.[0] || 'https://placehold.co/200x300/222/fff?text=No+Image'} alt={movie.title} className="w-full h-48 object-cover rounded-lg border border-zinc-700 mb-3" />
                    <div className="space-y-2">
                      <div className="font-semibold text-white text-sm">{movie.title} <span className="text-gray-400 text-xs">({movie.year})</span></div>
                      <div className="text-xs text-gray-400 line-clamp-2">{movie.description}</div>
                      {movie.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400 text-xs">⭐</span>
                          <span className="text-white text-xs">{movie.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {movie.providers && movie.providers.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-blue-400 text-xs">📺</span>
                          <span className="text-white text-xs">{movie.providers[0].name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showRecap && (
        <Recap
          likedMovies={likedMovies}
          dislikedMovies={dislikedMovies}
          onClose={() => setShowRecap(false)}
          onRetakeQuiz={() => { setShowRecap(false); setQuizAnswers(null); setShowQuiz(true); }}
        />
      )}
    </div>
  );
}

function SwipeCardLogo({ size = 44 }) {
  // SVG: stylized swipe card with arrow
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="28" height="18" rx="4" fill="#fff" fillOpacity="0.9" stroke="#6c3fa7" strokeWidth="2.5" />
      <rect x="12" y="16" width="20" height="6" rx="2" fill="#3ddad7" fillOpacity="0.8" />
      <path d="M22 32c4 0 7-3 7-7" stroke="#3ddad7" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M29 25l-2.5-2.5M29 25l-2.5 2.5" stroke="#6c3fa7" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}