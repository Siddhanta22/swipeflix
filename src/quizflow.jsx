import { useState, useEffect } from 'react'
import FloatingIcons from './FloatingIcons'
import PlatformLogo from './PlatformLogos'

const QUESTIONS = [
  {
    id: 'platforms',
    text: 'What streaming services do you use?',
    emoji: '📺',
    type: 'multi',
    options: [
      { key: 'netflix', label: 'Netflix', logo: 'netflix', accent: 'from-slate-700 to-slate-900' },
      { key: 'prime', label: 'Prime Video', logo: 'prime', accent: 'from-slate-700 to-slate-900' },
      { key: 'disney', label: 'Disney+', logo: 'disney', accent: 'from-slate-700 to-slate-900' },
      { key: 'hulu', label: 'Hulu', logo: 'hulu', accent: 'from-slate-700 to-slate-900' },
      { key: 'apple', label: 'Apple TV+', logo: 'apple', accent: 'from-slate-700 to-slate-900' },
      { key: 'paramount', label: 'Paramount+', logo: 'paramount', accent: 'from-slate-700 to-slate-900' },
    ],
    description: 'Pick your favorites!'
  },
  {
    id: 'mood',
    text: 'What mood are you in today?',
    emoji: '🎭',
    type: 'single',
    options: [
      { key: 'action', label: 'Fast & Thrilling', emoji: '⚡', accent: 'from-orange-500 to-red-700' },
      { key: 'comedy', label: 'Light & Silly', emoji: '😂', accent: 'from-yellow-400 to-orange-600' },
      { key: 'drama', label: 'Slow & Emotional', emoji: '🥹', accent: 'from-indigo-500 to-blue-800' },
      { key: 'romance', label: 'Warm & Sweet', emoji: '💕', accent: 'from-pink-500 to-rose-700' },
    ],
    description: 'What sounds good right now?'
  },
  {
    id: 'genre',
    text: 'Which genre calls to you?',
    emoji: '🎬',
    type: 'single',
    options: [
      { key: 'sci-fi', label: 'Sci-Fi & Fantasy', emoji: '🚀', accent: 'from-violet-500 to-purple-800' },
      { key: 'horror', label: 'Thriller & Horror', emoji: '👻', accent: 'from-red-800 to-black' },
      { key: 'comedy', label: 'Comedy & Fun', emoji: '🎪', accent: 'from-yellow-400 to-orange-600' },
      { key: 'drama', label: 'Drama & Realism', emoji: '🎭', accent: 'from-slate-500 to-blue-800' },
    ],
    description: 'Pick your vibe!'
  },
  {
    id: 'experience',
    text: 'What kind of experience do you want?',
    emoji: '🌟',
    type: 'single',
    options: [
      { key: 'hidden-gems', label: 'Hidden Gems', emoji: '💎', accent: 'from-teal-500 to-cyan-800' },
      { key: 'popular', label: 'Popular Hits', emoji: '🔥', accent: 'from-red-500 to-orange-700' },
      { key: 'classics', label: 'Timeless Classics', emoji: '⭐', accent: 'from-amber-400 to-yellow-700' },
      { key: 'trending', label: 'Trending Now', emoji: '📈', accent: 'from-emerald-500 to-green-800' },
    ],
    description: 'What are you in the mood for?'
  },
  {
    id: 'binge',
    text: 'How do you like to watch?',
    emoji: '🍿',
    type: 'single',
    options: [
      { key: 'binge', label: 'Binge Everything!', emoji: '🍿', accent: 'from-purple-500 to-pink-700' },
      { key: 'casual', label: 'Casual Viewing', emoji: '😌', accent: 'from-sky-400 to-blue-700' },
      { key: 'selective', label: 'Very Selective', emoji: '🎯', accent: 'from-slate-400 to-slate-700' },
      { key: 'explore', label: 'Love Exploring', emoji: '🔍', accent: 'from-emerald-400 to-teal-700' },
    ],
    description: 'Your watching style!'
  },
]

export default function QuizFlow({ onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  const [isAdvancing, setIsAdvancing] = useState(false)

  // Ensure step is always valid
  const validStep = Math.max(0, Math.min(step, QUESTIONS.length - 1))
  const current = QUESTIONS[validStep] || QUESTIONS[0]
  const total = QUESTIONS.length

  // Initialize component safely (hooks must run on every render, so these
  // stay above the error early-return below)
  useEffect(() => {
    try {
      if (!current) {
        setError('Failed to load quiz questions');
      }
    } catch (err) {
      console.error('Error initializing QuizFlow:', err);
      setError('Failed to initialize quiz');
    }
  }, [step, total, current]);

  // Reset the single-select highlight whenever the question changes
  useEffect(() => {
    setSelectedOption(null)
    setIsAdvancing(false)
  }, [step])

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

  function advance(val) {
    try {
      if (validStep >= total - 1) {
        setAnswers(a => {
          const next = { ...a, [current.id]: val };
          onComplete(next);
          return next;
        });
      } else {
        setAnswers(a => ({ ...a, [current.id]: val }));
        setTimeout(() => setStep(s => Math.min(s + 1, total - 1)), 350);
      }
    } catch (err) {
      console.error('Error advancing quiz:', err);
      setError(err.message || 'An error occurred while processing your answer');
    }
  }

  // Used by multi-select Next/Skip, which already show selection via checkboxes
  function handleAnswer(val) {
    advance(val)
  }

  // Used by single-select options: flash the pick, then advance
  function handleSingleSelect(key) {
    if (isAdvancing) return
    setIsAdvancing(true)
    setSelectedOption(key)
    setTimeout(() => advance(key), 300)
  }

  function goBack() {
    if (validStep === 0) return
    setStep(s => Math.max(0, s - 1))
  }

  // Shared tile markup for both single- and multi-select options: a colored
  // accent wash that intensifies on hover/selection, with a checkmark badge
  // when selected.
  function OptionTile({ opt, selected, disabled, onClick, emojiSize = 'text-3xl' }) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`group relative overflow-hidden rounded-2xl border-2 p-4 transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 ${selected ? 'border-white shadow-lg scale-105' : 'border-white/20 hover:border-white/50'}`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${opt.accent || 'from-slate-600 to-slate-800'} transition-opacity duration-200 ${selected ? 'opacity-90' : 'opacity-30 group-hover:opacity-55'}`}
        />
        <div className="relative flex flex-col items-center gap-2">
          {opt.logo ? (
            <PlatformLogo id={opt.logo} size={40} />
          ) : (
            opt.emoji && <span className={emojiSize}>{opt.emoji}</span>
          )}
          <span className="font-semibold text-white text-center leading-tight">{opt.label}</span>
        </div>
        {selected && (
          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white text-purple-700 flex items-center justify-center text-sm font-bold shadow">
            ✓
          </span>
        )}
      </button>
    );
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


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-black to-blue-900 p-4 relative overflow-hidden animate-gradient-pan">
      <FloatingIcons dim />
      <div className="w-full max-w-lg mx-auto rounded-3xl bg-gradient-to-br from-white/10 to-white/5 shadow-2xl p-8 flex flex-col items-center relative border border-white/20" style={{backdropFilter: 'blur(8px)', zIndex: 1}}>
        {/* Progress bar + back button */}
        <div className="w-full flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={goBack}
            disabled={validStep === 0}
            aria-label="Previous question"
            className="text-white/70 hover:text-white disabled:opacity-0 disabled:pointer-events-none transition text-2xl leading-none"
          >
            ←
          </button>
          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-400 to-yellow-400 transition-all duration-300 ease-out"
              style={{ width: `${((step + 1) / total) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-purple-300 whitespace-nowrap">{step + 1} / {total}</span>
        </div>
        <div className="mb-2" key={`emoji-${current.id}`}>
          <span className="text-5xl animate-emoji-pop inline-block">{current.emoji}</span>
        </div>
          <div className="w-full animate-question-enter" key={current.id}>
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
                  <OptionTile
                    key={opt.key}
                    opt={opt}
                    selected={!!answers[current.id]?.includes(opt.key)}
                    onClick={() => handleMultiSelect(opt.key)}
                    emojiSize="text-2xl"
                  />
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
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {current.options?.map(opt => (
                  <OptionTile
                    key={opt.key}
                    opt={opt}
                    selected={selectedOption === opt.key}
                    disabled={isAdvancing}
                    onClick={() => handleSingleSelect(opt.key)}
                  />
                ))}
              </div>
              <div className="text-center mb-4">
                <button
                  type="button"
                  onClick={() => handleSingleSelect(null)}
                  disabled={isAdvancing}
                  className="text-sm text-white/50 hover:text-white/80 underline transition disabled:opacity-0"
                >
                  Skip
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}