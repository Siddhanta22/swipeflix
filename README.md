# 🎬 SwipeFlix - Movie Discovery App

A Tinder-style app for discovering movies! Swipe through trending films, rate them, and build your movie preferences.

## ✨ Features

- **🎯 Interactive Quiz**: Answer questions to personalize your experience
- **🔄 Smooth Swiping**: Swipe left/right or use buttons to rate movies
- **📸 Multiple Images**: Tap to cycle through movie posters and backdrops
- **💾 Persistent Storage**: Your likes/dislikes are saved locally
- **📊 Progress Tracking**: See your progress through the movie deck
- **🎨 Beautiful UI**: Modern, responsive design with smooth animations
- **📱 Mobile Friendly**: Works great on all devices
- **🧩 Genre Filter**: Filter movies by genre with a dropdown at the top
- **♾️ Unlimited Movies**: Swipe through hundreds of movies, not just 20!

## 🚀 Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd swipeflix
   npm install
   ```

2. **Get a TMDB API key:**
   - Go to [The Movie Database](https://www.themoviedb.org/settings/api)
   - Create a free account and request an API key
   - Copy your API key

3. **Create environment file:**
   ```bash
   # Create .env file in the root directory
   echo "VITE_TMDB_API_KEY=your_api_key_here" > .env
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173`

## 🎮 How to Use

1. **Take the Quiz**: Answer questions about your movie preferences
2. **Filter by Genre**: Use the dropdown at the top to filter movies by genre
3. **Swipe Movies**: 
   - Swipe right to like ✅
   - Swipe left to dislike ❌
   - Or use the buttons at the bottom
4. **Explore Images**: Tap on the movie card to cycle through images
5. **View Stats**: See your likes/dislikes and progress
6. **Start Over**: When you finish the deck, you can start fresh

## 🛠️ Tech Stack

- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **TMDB API** - Movie data and images

## 🔧 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🎯 Key Features Explained

### Quiz System
- 6 engaging questions about movie preferences
- Smooth transitions between questions
- Skip option available
- Progress indicator

### Swipe Mechanics
- Drag to swipe left/right
- Button controls for accessibility
- Smooth card animations
- Visual feedback

### Image Gallery
- Multiple images per movie
- Tap to cycle through
- Progress indicators
- Fallback for failed images

### Data Persistence
- Likes/dislikes saved to localStorage
- Survives page refreshes
- Easy to reset

### Genre Filter
- Use the dropdown at the top to filter movies by genre
- Instantly reloads the deck with your chosen genre
- Works with unlimited movies

## 🐛 Troubleshooting

**"Missing TMDB API key" error:**
- Make sure you created a `.env` file
- Check that your API key is correct
- Verify the key has proper permissions

**Images not loading:**
- Check your internet connection
- Some movies may have limited images
- App includes fallback patterns

**Swipe not working:**
- Try using the buttons instead
- Check if you're on a touch device
- Refresh the page

## 📱 Mobile Optimization

- Touch-friendly swipe gestures
- Responsive design
- Optimized for mobile screens
- Smooth animations

## 🎨 Customization

The app uses Tailwind CSS for styling. You can easily customize:
- Colors in `tailwind.config.js`
- Animations in the components
- Layout and spacing
- Typography and themes

## 📄 License

MIT License - feel free to use this project for learning or building your own apps!
