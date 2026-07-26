# SwipeFlix 🎬

A swipe-based movie & TV discovery app. Take a quick quiz, then swipe through personalized picks pulled live from [TMDB](https://www.themoviedb.org/), with filters for genre, rating, language, and streaming platform — plus a Spotify-Wrapped-style recap of your session.

**Live demo:** [swipeflix-alpha.vercel.app](https://swipeflix-alpha.vercel.app/)

## Features

- **Onboarding quiz** — 5 questions (streaming platforms, mood, genre, the kind of experience you want, how you like to watch) that feed a weighted scoring algorithm biasing genre match, popularity/recency, and movie-vs-TV format
- **Swipe deck** — hand-built drag-follow and fly-off gesture animations (no animation library), showing rating, genres, cast, age certification, and where each title is streaming
- **Filters** — type (movie/TV), minimum rating, age rating, language, genre, and streaming platform, all live-applied to the deck
- **Watchlist** — save titles for later, persisted in `localStorage`
- **Similar titles** — pulls related picks when you like something
- **Session recap** — a tappable, story-style summary of what you swiped: like/dislike split, top genre, a computed "taste archetype," and your top-rated pick

## Tech stack

- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [TMDB API](https://www.themoviedb.org/documentation/api) for movie/TV data
- Plain CSS keyframe animations (no Framer Motion or other animation library)
- `localStorage` for watchlist persistence

This is a client-only app — there's no backend. It calls the TMDB API directly from the browser, which means the API key is bundled into the client (standard for a personal/portfolio project, but not how you'd ship this for production use at scale).

## Getting started

1. **Clone and install:**
   ```bash
   git clone https://github.com/Siddhanta22/swipeflix.git
   cd swipeflix
   npm install
   ```

2. **Get a TMDB API key** — free, from [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).

3. **Create a `.env` file** in the project root:
   ```
   VITE_TMDB_API_KEY=your_api_key_here
   ```

4. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open the printed `localhost` URL.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
  App.jsx          # Main app: filters, fetch/sort pipeline, watchlist, layout
  quizflow.jsx      # Onboarding quiz
  SwipeCard.jsx     # Swipeable card: gestures, image gallery, provider links
  Recap.jsx         # Session recap (Wrapped-style summary)
  PlatformLogos.jsx # Streaming service logo icons
  FloatingIcons.jsx # Ambient background animation
  storage.js        # localStorage helpers (watchlist)
```
