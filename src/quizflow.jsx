import { useState, useEffect } from 'react'

const QUESTIONS = [
  {
    id: 'platforms',
    text: 'What streaming services do you use?',
    emoji: '📺',
    type: 'multi',
    options: [
      { key: 'netflix', label: 'Netflix' },
      { key: 'prime', label: 'Prime Video' },
      { key: 'disney', label: 'Disney+' },
      { key: 'hulu', label: 'Hulu' },
      { key: 'apple', label: 'Apple TV+' },
      { key: 'paramount', label: 'Paramount+' },
    ],
    description: 'Pick your favorites!'
  },
  { 
    id: 'mood',  
    text: 'What mood are you in today?',
    emoji: '🎭',
    type: 'single',
    options: [
      { key: 'action', label: 'Action & Adventure', emoji: '💥' },
      { key: 'comedy', label: 'Laugh & Relax', emoji: '😂' },
      { key: 'drama', label: 'Deep & Emotional', emoji: '🎭' },
      { key: 'romance', label: 'Love & Romance', emoji: '💕' },
    ],
    description: 'What sounds good right now?'
  },
  { 
    id: 'genre', 
    text: 'Which genre calls to you?',
    emoji: '🎬',
    type: 'single',
    options: [
      { key: 'sci-fi', label: 'Sci-Fi & Fantasy', emoji: '🚀' },
      { key: 'horror', label: 'Thriller & Horror', emoji: '👻' },
      { key: 'comedy', label: 'Comedy & Fun', emoji: '🎪' },
      { key: 'drama', label: 'Drama & Realism', emoji: '🎭' },
    ],
    description: 'Pick your vibe!'
  },
  {
    id: 'experience',
    text: 'What kind of experience do you want?',
    emoji: '🌟',
    type: 'single',
    options: [
      { key: 'hidden-gems', label: 'Hidden Gems', emoji: '💎' },
      { key: 'popular', label: 'Popular Hits', emoji: '🔥' },
      { key: 'classics', label: 'Timeless Classics', emoji: '⭐' },
      { key: 'trending', label: 'Trending Now', emoji: '📈' },
    ],
    description: 'What are you in the mood for?'
  },
  {
    id: 'binge',
    text: 'How do you like to watch?',
    emoji: '🍿',
    type: 'single',
    options: [
      { key: 'binge', label: 'Binge Everything!', emoji: '🍿' },
      { key: 'casual', label: 'Casual Viewing', emoji: '😌' },
      { key: 'selective', label: 'Very Selective', emoji: '🎯' },
      { key: 'explore', label: 'Love Exploring', emoji: '🔍' },
    ],
    description: 'Your watching style!'
  },
]

export default function QuizFlow({ onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState(null)

  // Ensure step is always valid
  const validStep = Math.max(0, Math.min(step, QUESTIONS.length - 1))

  // Add error boundary
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#232946] to-[#6c3fa7] p-4">
        <div className="w-full max-w-md mx-auto rounded-3xl bg-white/10 shadow-2xl p-8 flex flex-col items-center">
          <div className="text-2xl mb-4">⚠️</div>
          <div className="text-xl font-bold text-white mb-2">Something went wrong</div>
          <div className="text-white/80 mb-4 text-center">{error}</div>
          <button 
            className="px-6 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  const current = QUESTIONS[validStep] || QUESTIONS[0]
  const total = QUESTIONS.length

  // Debug logging
  console.log('Quiz state:', { step, total, current: current?.id, currentText: current?.text })

  // Initialize component safely
  useEffect(() => {
    try {
      console.log('QuizFlow initialized with step:', step, 'total:', total);
      console.log('Current question:', current);
      console.log('Environment check:', {
        hasApiKey: !!import.meta.env.VITE_TMDB_API_KEY,
        apiKeyLength: import.meta.env.VITE_TMDB_API_KEY?.length
      });
      if (!current) {
        setError('Failed to load quiz questions');
      }
    } catch (err) {
      console.error('Error initializing QuizFlow:', err);
      setError('Failed to initialize quiz');
    }
  }, [step, total, current]);

  function handleAnswer(val) {
    try {
      console.log('handleAnswer called:', { val, step, validStep, total, current: current?.id })
      if (validStep >= total - 1) {
        setAnswers(a => {
          const next = { ...a, [current.id]: val };
          console.log('Quiz completed, calling onComplete with:', next);
          onComplete(next);
          return next;
        });
      } else {
        setAnswers(a => ({ ...a, [current.id]: val }));
        setTimeout(() => setStep(s => Math.min(s + 1, total - 1)), 350);
      }
    } catch (err) {
      console.error('Error in handleAnswer:', err);
      setError(err.message || 'An error occurred while processing your answer');
    }
  }

  function handleMultiSelect(key) {
    setAnswers(a => {
      const prev = a[current.id] || []
      if (prev.includes(key)) {
        return { ...a, [current.id]: prev.filter(k => k !== key) }
      } else {
        return { ...a, [current.id]: [...prev, key] }
      }
    })
  }

  function handleSwipe(direction) {
    if (current.type === 'multi') {
      if (direction === 'right') {
        handleAnswer(answers[current.id] || []);
      } else if (direction === 'left') {
        handleAnswer([]);
      }
    } else {
      if (direction === 'right') {
        handleAnswer(true);
      } else if (direction === 'left') {
        handleAnswer(false);
      }
    }
  }

  function handleSubmit() {
    onComplete(answers)
  }

  function resetQuiz() {
    setStep(0)
    setAnswers({})
    setError(null)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-black to-blue-900 p-4">
      <div className="w-full max-w-lg mx-auto rounded-3xl bg-gradient-to-br from-white/10 to-white/5 shadow-2xl p-8 flex flex-col items-center relative border border-white/20" style={{backdropFilter: 'blur(8px)'}}>
        <div className="flex flex-row items-center gap-3 mb-6">
          <span className="text-4xl animate-bounce">{current.emoji}</span>
          <span className="text-lg font-semibold text-purple-300">Question {step + 1} of {total}</span>
          <span className="text-2xl">{step < total - 1 ? '👉' : '🎬'}</span>
        </div>
          <div className="w-full">
          <div className="text-3xl md:text-4xl font-bold text-white mb-4 text-center leading-tight" style={{letterSpacing: 1}}>
            {current?.text || 'Loading question...'}
          </div>
          <div className="text-lg text-white/80 mb-8 text-center" style={{fontStyle: 'italic'}}>
            {current?.description || 'Please wait...'}
          </div>
          {current.type === 'multi' ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {current.options.map(opt => (
                  <button
                    key={opt.key}
                    className={`p-4 rounded-xl font-semibold text-base transition-all duration-200 transform hover:scale-105 border-2 ${answers[current.id]?.includes(opt.key) ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-400 text-white shadow-lg' : 'bg-white/10 border-white/30 text-white/90 hover:bg-white/20 hover:border-white/50'}`}
                    onClick={() => handleMultiSelect(opt.key)}
                  >
                    <div className="flex items-center gap-2">
                      {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
                      <span>{opt.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex flex-row gap-4 justify-center mb-2">
                <button
                  className="px-6 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-lg transition disabled:opacity-50"
                  onClick={() => handleAnswer(answers[current.id] || [])}
                  disabled={!(answers[current.id] && answers[current.id].length > 0)}
                >
                  Next
                </button>
                <button
                  className="px-6 py-3 rounded-full bg-gray-400 hover:bg-gray-500 text-white font-bold text-lg shadow-lg transition"
                  onClick={() => handleAnswer([])}
                >
                  Skip
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4 mb-8">
              {current.options?.map(opt => (
                <button
                  key={opt.key}
                  className="p-4 rounded-xl font-semibold text-base transition-all duration-200 transform hover:scale-105 border-2 bg-white/10 border-white/30 text-white/90 hover:bg-white/20 hover:border-white/50"
                  onClick={() => handleAnswer(opt.key)}
                >
                  <div className="flex items-center gap-3">
                    {opt.emoji && <span className="text-2xl">{opt.emoji}</span>}
                    <span>{opt.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {step === total - 1 ? (
          <button
              className="w-full mt-4 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-pink-400 text-black font-extrabold text-lg shadow-xl hover:scale-105 transition"
              onClick={handleSubmit}
          >
              See My Matches
          </button>
          ) : step > total - 1 ? (
          <button
              className="w-full mt-4 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-lg shadow-xl transition"
              onClick={resetQuiz}
          >
              Reset Quiz
          </button>
          ) : null}
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-row gap-1">
          {QUESTIONS.map((q, i) => (
            <span key={q.id} className={`w-3 h-3 rounded-full ${i === step ? 'bg-yellow-400' : 'bg-white/30'} transition-all`} />
          ))}
        </div>
      </div>
      <style>{`
        .animate-fade-in { animation: fadeIn 1.2s both; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(24px);} to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  )
}