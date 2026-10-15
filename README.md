# SwipeFlix 🎬

**Swipe right for a good time.** SwipeFlix helps you decide what to watch tonight, without the scroll.

**Live demo:** [swipeflix-alpha.vercel.app](https://swipeflix-alpha.vercel.app/)

## Why this exists

Picking something to watch is harder than it should be. Every streaming app buries you in rows of thumbnails, and you can easily spend 30 minutes scrolling and still end up rewatching the same sitcom. The problem isn't a shortage of movies and shows. It's that choosing between thousands of them is tiring.

SwipeFlix turns that into something quick and a little fun:

1. **Tell it your taste.** A 5-question quiz covers the streaming services you have, your mood, your genre, whether you want hidden gems or big hits, and how you like to watch.
2. **Swipe.** You get one title at a time, with its poster, rating, cast, and where it's streaming. Swipe right to like, left to pass. No endless lists.
3. **See what you've been picking.** The recap pulls your swipes together: how much you liked versus passed, your top genre, a "taste type," and your highest-rated pick. You get a clear answer to "what do I actually like?"

## How it works

- **The quiz sets the order of your deck.** Your answers are saved in app state and used to score every title. Genre matches, popularity, recency, and your preference for movies versus shows all feed the score. Your picks show up first, and the deck never runs dry.
- **Live data, not a stale list.** Titles come straight from [TMDB](https://www.themoviedb.org/), filtered down to what's out now and streaming somewhere you can watch.
- **Filters when you want control.** Narrow by movie or TV, minimum rating, age rating, language, genre, or streaming platform.
- **Keep the good ones.** Save any title to a watchlist that persists on your device. Liking a title also pulls up similar ones.
- **The recap.** It's a tap-through, story-style summary of your session, inspired by Spotify Wrapped (not a copy of it).

## Built with

| What | Why |
|---|---|
| [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) | Fast dev loop, simple component model for the quiz, deck, and recap |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling without a pile of custom CSS |
| [TMDB API](https://www.themoviedb.org/documentation/api) | Movie and TV data: posters, ratings, cast, certifications, streaming providers |
| Plain CSS transforms and keyframes | The swipe gesture (drag-follow, snap-back, fly-off) is hand-built, with no animation library |
| `localStorage` | Watchlist persistence, no account needed |
| [Vercel](https://vercel.com/) | Hosting for the live demo |

It's a client-only app. There's no backend or database: the browser talks to TMDB directly and keeps your watchlist locally.

## Where it's headed

Not built yet, but this is the plan:

- **Learn from your swipes.** Today the quiz drives the ranking and the recap summarizes your swipes afterward. Next, the deck should adapt as you swipe, so the more you use it, the better it gets at predicting what you'll like.
- **A thin backend in front of TMDB.** It would cache responses, cut the number of requests per filter change, and keep the API key off the client.
- **Tests.** Component tests for the quiz and integration tests around the scoring and filter pipeline.
- **Accounts and sync.** Take your watchlist and taste profile across devices.

## Run it locally

1. **Clone and install:**
   ```bash
   git clone https://github.com/Siddhanta22/swipeflix.git
   cd swipeflix
   npm install
   ```

2. **Get a TMDB API key.** It's free, from [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).

3. **Create a `.env` file** in the project root:
   ```
   VITE_TMDB_API_KEY=your_api_key_here
   ```

4. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Open the printed `localhost` URL.

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
  App.jsx           # Main app: filters, fetch + scoring pipeline, watchlist, layout
  quizflow.jsx      # Onboarding quiz
  SwipeCard.jsx     # Swipeable card: gestures, image gallery, provider links
  Recap.jsx         # Session recap (Wrapped-style summary)
  PlatformLogos.jsx # Streaming service logos
  FloatingIcons.jsx # Ambient background animation
  storage.js        # localStorage helpers (watchlist)
```
