// src/App.js
import { useState, useEffect, useRef } from 'react';
import QuizFlow from './quizflow';
import SwipeCard from './SwipeCard';
import { getWatchlist, removeFromWatchlist } from './storage';

const TMDB = 'https://api.themoviedb.org/3';
const FALLBACK = 'https://placehold.co/800x1200/222/fff?text=No+Image';

const PLATFORM_OPTIONS = [
  { key: 'netflix', label: 'Netflix' },
  { key: 'prime', label: 'Prime Video' },
  { key: 'disney', label: 'Disney+' },
  { key: 'hotstar', label: 'Hotstar' },
  { key: 'hulu', label: 'Hulu' },
  { key: 'apple', label: 'Apple TV+' },
  { key: 'zee5', label: 'ZEE5' },
  { key: 'jio', label: 'JioCinema' },
  { key: 'sony', label: 'SonyLiv' },
  { key: 'paramount', label: 'Paramount+' },
  { key: 'discovery', label: 'Discovery+' },
  { key: 'youtube', label: 'YouTube' },
];

export default function App() {
  const [showQuiz, setShowQuiz] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [likedMovies, setLikedMovies] = useState([]);
  const [dislikedMovies, setDislikedMovies] = useState([]);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'movie', 'tv'
  const [minRating, setMinRating] = useState(0);
  const [seenIds, setSeenIds] = useState(new Set());
  const [pendingResults, setPendingResults] = useState([]);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [languages, setLanguages] = useState([]);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [watchlist, setWatchlist] = useState(getWatchlist());
  const [selectedCertification, setSelectedCertification] = useState('');
  const certificationsList = [
    { value: '', label: 'All Ratings' },
    { value: 'G', label: 'G/TV-G' },
    { value: 'PG', label: 'PG/TV-PG' },
    { value: 'PG-13', label: 'PG-13/TV-14' },
    { value: 'R', label: 'R/TV-MA' },
    { value: 'NC-17', label: 'NC-17' },
    { value: 'TV-Y', label: 'TV-Y' },
    { value: 'TV-Y7', label: 'TV-Y7' },
    { value: 'TV-G', label: 'TV-G' },
    { value: 'TV-PG', label: 'TV-PG' },
    { value: 'TV-14', label: 'TV-14' },
    { value: 'TV-MA', label: 'TV-MA' },
  ];
  const [showHome, setShowHome] = useState(true);
  const [swipeOut, setSwipeOut] = useState(false); // for swiping animation
  const homeCardRef = useRef(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  // Initialization Effect
  useEffect(() => {
    const key = import.meta.env.VITE_TMDB_API_KEY;
    console.log('App initialization - API Key available:', !!key, 'Key length:', key?.length);
    if (!key) {
      setError('Missing TMDB API key. Please check your environment variables.');
    }
    setIsInitialized(true);
  }, []);

  const handleQuizComplete = (answers) => {
    console.log('handleQuizComplete called with:', answers);
    console.log('API Key available:', !!import.meta.env.VITE_TMDB_API_KEY);
    console.log('API Key length:', import.meta.env.VITE_TMDB_API_KEY?.length);
    console.log('Setting quizAnswers and showQuiz=false');
    setQuizAnswers(answers);
    setShowQuiz(false);
    setIsLoading(true); // Immediately enter loading state
    console.log('Quiz completion state changes triggered');
  };

  const handleSwipe = (movie, preference) => {
    if (preference === 'like') {
      setLikedMovies((prev) => [...prev, movie]);
    } else {
      setDislikedMovies((prev) => [...prev, movie]);
    }
    // Advance to next card from pendingResults
    const nextIdx = pendingResults.findIndex(m => m.id === movie.id) + 1;
    const next = pendingResults.slice(nextIdx).find(m => !seenIds.has(m.id));
    if (next) {
      // Fetch details for this movie
      (async () => {
        const key = import.meta.env.VITE_TMDB_API_KEY;
        const images = await fetch(`${TMDB}/${next.media_type}/${next.id}/images?api_key=${key}`)
          .then((r) => r.json())
          .then((x) =>
            [
              ...(x.backdrops || []).map((b) => b.file_path),
              ...(x.posters || []).map((p) => p.file_path),
            ]
              .slice(0, 6)
              .map((p) => `https://image.tmdb.org/t/p/original${p}`)
          )
          .then((imgs) => (imgs.length ? imgs : [FALLBACK]));
        const credits = await fetch(`${TMDB}/${next.media_type}/${next.id}/credits?api_key=${key}`)
          .then((r) => r.json())
          .catch(() => ({ cast: [] }));
        const cast = Array.isArray(credits.cast)
          ? credits.cast.slice(0, 5).map(actor => ({
              name: actor.name,
              profile: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null
            }))
          : [];
        const providersData = await fetch(`${TMDB}/${next.media_type}/${next.id}/watch/providers?api_key=${key}`)
          .then((r) => r.json())
          .catch(() => ({}));
        const usProviders = providersData.results && providersData.results.US && providersData.results.US.flatrate
          ? providersData.results.US.flatrate.map(p => ({
              name: p.provider_name,
              logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null
            }))
          : [];
        const shaped = {
          id: next.id,
          title: next.title || next.name || 'Untitled',
          year: (next.release_date || next.first_air_date || '').split('-')[0] || '',
          description: next.overview || 'No description',
          images,
          rating: next.vote_average || null,
          cast,
          providers: usProviders,
        };
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

  // Fetch available languages from TMDB
  useEffect(() => {
    const key = import.meta.env.VITE_TMDB_API_KEY;
    if (!key) return;
    fetch(`${TMDB}/configuration/languages?api_key=${key}`)
      .then(r => r.json())
      .then(d => setLanguages(d))
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

  // Map quiz answers to preferred genres
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
    return Object.entries(quizAnswers)
      .filter(([k, v]) => v === true)
      .map(([k]) => mapping[k])
      .filter(Boolean);
  }

  useEffect(() => {
    console.log('Movie fetching useEffect triggered:', { showQuiz, quizAnswers: !!quizAnswers });
    if (showQuiz) return;
    const key = import.meta.env.VITE_TMDB_API_KEY;
    console.log('API Key available:', !!key, 'Key length:', key?.length);
    if (!key) {
      setError('Missing TMDB API key. Please check your environment variables.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSeenIds(new Set());
    setPendingResults([]);
    setFetchingMore(false);
    
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
      let endpointType = selectedType;
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
        // No language filter: use trending or discover as before
        let url = `${TMDB}/trending/all/week?api_key=${key}`;
        endpointType = 'all';
        if (selectedGenre) {
          url = `${TMDB}/discover/movie?api_key=${key}&with_genres=${selectedGenre}`;
          endpointType = 'movie';
        }
        // Pick a random starting page (1-500)
        const maxPage = 500;
        const randomStartPage = Math.floor(Math.random() * maxPage) + 1;
        results = await fetchMoreResults(url, randomStartPage, 5);
        if (endpointType === 'all') {
          results = results.filter(m => m.media_type === 'movie' || m.media_type === 'tv');
        } else if (endpointType === 'movie') {
          results = results.map(m => ({ ...m, media_type: 'movie' }));
        }
      }
      // After filtering and before sorting, bias toward quiz genres
      const preferredGenres = getPreferredGenresFromQuiz(quizAnswers);
      if (preferredGenres.length > 0) {
        results.sort((a, b) => {
          const aMatch = a.genres && a.genres.some(g => preferredGenres.includes(g));
          const bMatch = b.genres && b.genres.some(g => preferredGenres.includes(g));
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          return 0;
        });
      }
      // Fetch certifications and providers for each result
      const withCertsAndProviders = await Promise.all(results.map(async (m) => {
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
        } catch {}
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
        } catch {}
        return { ...m, certification, genres: genresArr, providers: usProviders };
      }));
      // Only include released movies with streaming providers
      const now = new Date();
      const filtered = withCertsAndProviders.filter(m => {
        const releaseDate = new Date(m.release_date || m.first_air_date || '1900-01-01');
        if (releaseDate > now) return false;
        return m.providers && Array.isArray(m.providers) && m.providers.length > 0;
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
      // Sort by popularity and rating
      filteredByPlatform.sort((a, b) => ((b.vote_average || 0) * (b.popularity || 1)) - ((a.vote_average || 0) * (a.popularity || 1)));
      // Remove duplicates by TMDB id
      const unique = [];
      const seen = new Set();
      for (const m of filteredByPlatform) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          unique.push(m);
        }
      }
      setPendingResults(shuffleArray(unique));
      setMovies([]);
      setCurrentIndex(0);
      setLikedMovies([]);
      setDislikedMovies([]);
      setHasInitiallyLoaded(true);
      setIsLoading(false);
      clearTimeout(timeoutId); // Clear timeout on success
    };
    
    // Add error handling to fetchInitial
    fetchInitial().catch((error) => {
      console.error('Error fetching movies:', error);
      setError('Failed to fetch movies. Please check your internet connection and try again.');
      setIsLoading(false);
      clearTimeout(timeoutId); // Clear timeout on error
    });
  }, [showQuiz, selectedGenre, selectedType, minRating, selectedLanguage, selectedCertification, quizAnswers]);

  // When pendingResults or seenIds change, load the first card if needed
  useEffect(() => {
    if (!currentCard && pendingResults.length > 0) {
      const next = pendingResults.find(m => !seenIds.has(m.id));
      if (next) {
        (async () => {
          const key = import.meta.env.VITE_TMDB_API_KEY;
          const images = await fetch(`${TMDB}/${next.media_type}/${next.id}/images?api_key=${key}`)
            .then((r) => r.json())
            .then((x) =>
              [
                ...(x.backdrops || []).map((b) => b.file_path),
                ...(x.posters || []).map((p) => p.file_path),
              ]
                .slice(0, 6)
                .map((p) => `https://image.tmdb.org/t/p/original${p}`)
            )
            .then((imgs) => (imgs.length ? imgs : [FALLBACK]));
          const credits = await fetch(`${TMDB}/${next.media_type}/${next.id}/credits?api_key=${key}`)
            .then((r) => r.json())
            .catch(() => ({ cast: [] }));
          const cast = Array.isArray(credits.cast)
            ? credits.cast.slice(0, 5).map(actor => ({
                name: actor.name,
                profile: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null
              }))
            : [];
          const providersData = await fetch(`${TMDB}/${next.media_type}/${next.id}/watch/providers?api_key=${key}`)
            .then((r) => r.json())
            .catch(() => ({}));
          const usProviders = providersData.results && providersData.results.US && providersData.results.US.flatrate
            ? providersData.results.US.flatrate.map(p => ({
                name: p.provider_name,
                logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null
              }))
            : [];
          const shaped = {
            id: next.id,
            title: next.title || next.name || 'Untitled',
            year: (next.release_date || next.first_air_date || '').split('-')[0] || '',
            description: next.overview || 'No description',
            images,
            rating: next.vote_average || null,
            cast,
            providers: usProviders,
          };
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
      .then((imgs) => (imgs.length ? imgs : [FALLBACK]));
    const credits = await fetch(`${TMDB}/${mediaType}/${item.id}/credits?api_key=${key}`)
      .then((r) => r.json())
      .catch(() => ({ cast: [] }));
    const cast = Array.isArray(credits.cast)
      ? credits.cast.slice(0, 5).map(actor => ({
          name: actor.name,
          profile: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null
        }))
      : [];
    const providersData = await fetch(`${TMDB}/${mediaType}/${item.id}/watch/providers?api_key=${key}`)
      .then((r) => r.json())
      .catch(() => ({}));
    const usProviders = providersData.results && providersData.results.US && providersData.results.US.flatrate
      ? providersData.results.US.flatrate.map(p => ({
          name: p.provider_name,
          logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null
        }))
      : [];
    const shaped = {
      ...item,
      images,
      cast,
      providers: usProviders,
    };
    setCurrentCard(shaped);
    setImgIdx(0);
    setShowWatchlist(false);
    addSeenIds([item.id]);
  };

  // Add a reset filters handler
  function handleResetFilters() {
    setSelectedGenre('');
    setSelectedType('all');
    setMinRating(0);
    setSelectedLanguage('');
    setSelectedCertification('');
    setSelectedPlatforms([]);
  }

  // --- Conditional Rendering Logic ---

  if (showHome) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #232946 0%, #6c3fa7 100%)', // deep blue to purple
      }}>
        {/* Floating cartoon icons */}
        <CartoonIcons />
        {/* Elegant glass card */}
        <div
          ref={homeCardRef}
          className={`backdrop-blur-lg bg-white/15 rounded-3xl shadow-2xl px-8 py-12 md:px-16 md:py-16 flex flex-col items-center animate-fade-in transition-transform duration-700 ${swipeOut ? 'swipe-out' : ''}`}
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
              setTimeout(() => setShowHome(false), 650);
            }}
            className="px-10 py-4 rounded-full font-extrabold text-xl shadow-xl transition-transform animate-fade-in border-2 border-white/30 glassy-swipe-btn"
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
            Start Swiping
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
        <style>{`
          .animate-fade-in { animation: fadeIn 1.2s both; }
          .animate-fade-in-slow { animation: fadeIn 2.2s both; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(24px);} to { opacity: 1; transform: none; } }
          .swipe-out { animation: swipeOut 0.7s cubic-bezier(.7,-0.1,.7,1.2) both; }
          @keyframes swipeOut {
            0% { transform: translateX(0) rotate(0deg); opacity: 1; }
            60% { transform: translateX(60vw) rotate(12deg) scale(1.05); opacity: 1; }
            100% { transform: translateX(120vw) rotate(18deg) scale(0.9); opacity: 0; }
          }
          .glassy-swipe-btn {
            transition: box-shadow 0.25s, transform 0.18s, background 0.3s;
            background-size: 200% 100%;
            filter: drop-shadow(0 0 8px #6c3fa7cc);
          }
          .glassy-swipe-btn:hover {
            box-shadow: 0 0 0 4px #3ddad799, 0 2px 32px #6c3fa7cc, 0 1.5px 0 #fff2;
            transform: scale(1.08) rotate(-2deg);
            background: rgba(61, 218, 215, 0.18);
            filter: brightness(1.08) saturate(1.2) drop-shadow(0 0 16px #3ddad7cc);
          }
        `}</style>
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

  // General Loading State Enhancement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-white rounded-full mb-4"/>
        <p className="text-lg">Loading SwipeFlix...</p>
        <p className="text-sm text-gray-400 mt-2">Fetching your perfect movie matches</p>
      </div>
    );
  }

  // Debug component to show API key status
  const apiKeyStatus = import.meta.env.VITE_TMDB_API_KEY ? '✅ Set' : '❌ Missing';
  const apiKeyLength = import.meta.env.VITE_TMDB_API_KEY?.length || 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Debug info - remove this after fixing */}
      <div className="fixed top-0 left-0 right-0 bg-red-900 text-white text-xs p-2 text-center z-50">
        Debug: API Key {apiKeyStatus} (Length: {apiKeyLength}) | Quiz: {showQuiz ? 'Active' : 'Complete'} | Loading: {isLoading ? 'Yes' : 'No'}
      </div>
      
      {/* Rest of the app */}
      {showQuiz ? (
        <QuizFlow onComplete={handleQuizComplete} />
      ) : (
        <div className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col items-center justify-center">
      {/* Filter Bar + Reset Button */}
      <div className="fixed top-0 left-0 w-full z-50 flex flex-row items-center gap-3 px-4 pt-4 bg-black/70 backdrop-blur-md overflow-x-auto whitespace-nowrap" style={{minHeight: 60}}>
        {/* Type Filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-300 mr-2">Type:</span>
          <button onClick={() => setSelectedType('all')} className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedType==='all' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-200'}`}>All</button>
          <button onClick={() => setSelectedType('movie')} className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedType==='movie' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-200'}`}>Movies</button>
          <button onClick={() => setSelectedType('tv')} className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedType==='tv' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-200'}`}>TV Shows</button>
        </div>
        {/* Rating Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300">Min Rating:</span>
          <input type="range" min="0" max="10" step="0.5" value={minRating} onChange={e => setMinRating(Number(e.target.value))} className="accent-blue-500" style={{width: 80}} />
          <span className="text-xs text-white font-bold w-6 text-center">{minRating}</span>
        </div>
        {/* Age Rating Filter */}
        <div>
          <select
            value={selectedCertification}
            onChange={e => setSelectedCertification(e.target.value)}
            className="bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 max-w-[120px] text-ellipsis overflow-hidden"
            style={{maxWidth: 120}}
          >
            {certificationsList.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {/* Language Filter */}
        <div>
          <select
            value={selectedLanguage}
            onChange={e => setSelectedLanguage(e.target.value)}
            className="bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 max-w-[120px] text-ellipsis overflow-hidden"
            style={{maxWidth: 120}}
          >
            <option value="">All Languages</option>
            {languages.map((lang) => (
              <option key={lang.iso_639_1} value={lang.iso_639_1}>{lang.english_name}</option>
            ))}
          </select>
        </div>
        {/* Genre Filter */}
        <div>
          <select
            value={selectedGenre}
            onChange={(e) => { setHasInitiallyLoaded(false); setSelectedGenre(e.target.value) }}
            className="bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 max-w-[180px] text-ellipsis overflow-hidden"
            style={{maxWidth: 180}}
          >
            <option value="">All Genres</option>
            {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <button
          onClick={handleResetFilters}
          className="ml-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition"
        >
          Reset Filters
        </button>
      </div>

      <div className="flex flex-col items-center justify-center w-full h-full flex-1 relative" style={{minHeight: '100vh'}}>
        {currentCard && (
          <>
            <SwipeCard
              key={currentCard.id}
              movie={currentCard}
              isTopCard={true}
              onSwipe={(preference) => handleSwipe(currentCard, preference)}
              imgIdx={imgIdx}
              setImgIdx={setImgIdx}
            />
            {/* Action Buttons - floating at the bottom center */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center gap-8 z-50">
              <button
                onClick={() => handleSwipe(currentCard, 'dislike')}
                className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-3xl shadow-lg hover:bg-red-700 transition border-4 border-white"
                aria-label="Dislike"
                style={{boxShadow: '0 4px 16px rgba(0,0,0,0.5)'}}
              >
                <span style={{color: 'white', fontWeight: 'bold', fontSize: 36, lineHeight: 1}}>&#10006;</span>
              </button>
              <button
                onClick={() => setShowWatchlist(true)}
                className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center text-3xl shadow-lg hover:bg-yellow-500 transition border-4 border-white mx-2"
                aria-label="My Watchlist"
                style={{boxShadow: '0 4px 16px rgba(0,0,0,0.5)'}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#222" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.75.75 0 0 1 1.04 0l2.348 2.382 3.284.478a.75.75 0 0 1 .416 1.28l-2.377 2.32.561 3.27a.75.75 0 0 1-1.088.791L12 12.347l-2.94 1.543a.75.75 0 0 1-1.088-.79l.56-3.271-2.376-2.32a.75.75 0 0 1 .416-1.28l3.284-.478 2.348-2.382z" />
                </svg>
              </button>
              <button
                onClick={() => handleSwipe(currentCard, 'like')}
                className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-3xl shadow-lg hover:bg-green-700 transition"
                aria-label="Like"
              >
                ❤️
              </button>
            </div>
          </>
        )}
      </div>

      {/* Watchlist Modal */}
      {showWatchlist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur" style={{animation: 'fadeIn 0.2s'}}>
          <div className="bg-zinc-900 rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setShowWatchlist(false)}
              className="absolute top-3 right-3 text-white/70 hover:text-white text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold text-yellow-400 mb-4">My Watchlist</h2>
            {watchlist.length === 0 ? (
              <p className="text-gray-400">Your watchlist is empty.</p>
            ) : (
              <ul className="space-y-4">
                {watchlist.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 bg-zinc-800 rounded-lg p-3 cursor-pointer hover:bg-zinc-700 transition"
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
    </div>
  );
}

function CartoonIcons() {
  // Floating cartoon movie icons (popcorn, clapper, stars)
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden'}}>
      {/* Popcorn */}
      <span style={{position: 'absolute', top: '12%', left: '8%', fontSize: 44, opacity: 0.85, filter: 'drop-shadow(0 2px 8px #fff8)'}}>🍿</span>
      {/* Clapper */}
      <span style={{position: 'absolute', top: '18%', right: '10%', fontSize: 38, opacity: 0.8, filter: 'drop-shadow(0 2px 8px #7f5fff8c)'}}>🎬</span>
      {/* Star */}
      <span style={{position: 'absolute', bottom: '16%', left: '14%', fontSize: 36, opacity: 0.7, filter: 'drop-shadow(0 2px 8px #FFD7008c)'}}>⭐</span>
      {/* Film reel */}
      <span style={{position: 'absolute', bottom: '12%', right: '12%', fontSize: 40, opacity: 0.8, filter: 'drop-shadow(0 2px 8px #3ddad7a0)'}}>🎞️</span>
      {/* More stars */}
      <span style={{position: 'absolute', top: '8%', right: '22%', fontSize: 28, opacity: 0.6, filter: 'drop-shadow(0 2px 8px #fff8)'}}>✨</span>
      <span style={{position: 'absolute', bottom: '8%', left: '24%', fontSize: 24, opacity: 0.5, filter: 'drop-shadow(0 2px 8px #fff8)'}}>✨</span>
    </div>
  );
}

function SwipeCardLogo() {
  // SVG: stylized swipe card with arrow
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="28" height="18" rx="4" fill="#fff" fillOpacity="0.9" stroke="#6c3fa7" strokeWidth="2.5" />
      <rect x="12" y="16" width="20" height="6" rx="2" fill="#3ddad7" fillOpacity="0.8" />
      <path d="M22 32c4 0 7-3 7-7" stroke="#3ddad7" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M29 25l-2.5-2.5M29 25l-2.5 2.5" stroke="#6c3fa7" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}