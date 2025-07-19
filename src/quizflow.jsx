import { useState, useEffect } from 'react'

const QUESTIONS = [
  {
    id: 'platforms',
    text: 'Which streaming platforms do you use?',
    emoji: '📺',
    type: 'multi',
    options: [
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
    ],
    description: 'Pick all that you have access to!'
  },
  { 
    id: 'action',  
    text: 'Do you crave high-octane action?',
    emoji: '💥',
    description: 'Explosions, car chases, epic battles'
  },
  { 
    id: 'romance', 
    text: 'Love a swoony romance subplot?',
    emoji: '💕',
    description: 'Love stories, emotional connections'
  },
  {
    id: 'comedy',
    text: 'Need a good laugh from time to time?',
    emoji: '😂',
    description: 'Humor, witty dialogue, funny situations'
  },
  { 
    id: 'sci-fi',  
    text: 'Fascinated by futuristic sci-fi worlds?',
    emoji: '🚀',
    description: 'Space, technology, alternate realities'
  },
  { 
    id: 'horror',  
    text: 'Enjoy a spine-tingling scare?',
    emoji: '👻',
    description: 'Suspense, thrills, supernatural elements'
  },
  { 
    id: 'drama',   
    text: 'Appreciate deep, emotional storytelling?',
    emoji: '🎭',
    description: 'Character development, complex narratives'
  },
  {
    id: 'rewatch',
    text: 'Do you love rewatching your favorites?',
    emoji: '🔁',
    description: 'Comfort watches, all-time classics'
  },
  {
    id: 'hidden-gems',
    text: 'Want to discover hidden gems?',
    emoji: '💎',
    description: 'Underrated, lesser-known picks'
  },
  {
    id: 'binge',
    text: 'Are you a binge-watcher?',
    emoji: '🍿',
    description: "Can't stop at just one episode/movie!"
  },
]

export default function QuizFlow({ onComplete }) {
  const [step, setStep] = useState(0)
  console.log("Quiz step initialized:", step)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState(null)

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

  const current = QUESTIONS[step]
  const total = QUESTIONS.length

  // Initialize component safely
  useEffect(() => {
    try {
      console.log('QuizFlow initialized with step:', step, 'total:', total);
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
      console.log('handleAnswer called:', { val, step, current: current?.id })
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#232946] to-[#6c3fa7] p-4">
      <div className="w-full max-w-md mx-auto rounded-3xl bg-white/10 shadow-2xl p-8 flex flex-col items-center relative" style={{backdropFilter: 'blur(8px)'}}>
        <div className="flex flex-row items-center gap-2 mb-4">
          <span className="text-2xl">{current.emoji}</span>
          <span className="text-lg font-bold text-white/90">Question {step + 1} of {total}</span>
          <span className="text-lg">{step < total - 1 ? '👉' : '🎬'}</span>
        </div>
          <div
          key={current.id}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -32 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className="w-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragEnd={(_, info) => {
            if (info.offset.x > 80) handleSwipe('right');
            else if (info.offset.x < -80) handleSwipe('left');
          }}
        >
          <div className="text-2xl md:text-3xl font-extrabold text-white mb-2 text-center" style={{letterSpacing: 1}}>{current.text}</div>
          <div className="text-base text-white/80 mb-6 text-center" style={{fontStyle: 'italic'}}>{current.description}</div>
          {current.type === 'multi' ? (
            <>
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {current.options.map(opt => (
                  <button
                    key={opt.key}
                    className={`px-4 py-2 rounded-full font-semibold text-sm transition border-2 ${answers[current.id]?.includes(opt.key) ? 'bg-blue-500 border-blue-400 text-white shadow-lg' : 'bg-white/20 border-white/30 text-white/80 hover:bg-blue-400/40'}`}
                    onClick={() => handleMultiSelect(opt.key)}
                  >
                    {opt.label}
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
            <div className="flex flex-row gap-4 justify-center mb-6">
              <button
                className="px-6 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-lg transition"
                onClick={() => handleAnswer(true)}
              >
                Yes
              </button>
              <button
                className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-lg shadow-lg transition"
                onClick={() => handleAnswer(false)}
              >
                No
              </button>
              <button
                className="px-6 py-3 rounded-full bg-gray-400 hover:bg-gray-500 text-white font-bold text-lg shadow-lg transition"
                onClick={() => handleAnswer(null)}
              >
                Skip
              </button>
            </div>
          )}
          {step === total - 1 ? (
          <button
              className="w-full mt-4 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-pink-400 text-black font-extrabold text-lg shadow-xl hover:scale-105 transition"
              onClick={handleSubmit}
          >
              See My Matches
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
}console.log("QUESTIONS array:", QUESTIONS.length, "First question:", QUESTIONS[0]?.text)
