# 🚀 Vercel Deployment Fix

## Current Issue
White screen after clicking "Skip" in quiz on Vercel deployment.

## Solution Steps

### 1. **Set Environment Variable**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your SwipeFlix project
3. Go to **Settings** → **Environment Variables**
4. Add: `VITE_TMDB_API_KEY` = `your_tmdb_api_key_here`
5. Deploy to all environments

### 2. **Get TMDB API Key**
1. Go to [TMDB API Settings](https://www.themoviedb.org/settings/api)
2. Create free account
3. Request API key
4. Copy the key

### 3. **Test Deployment**
1. Visit your Vercel URL
2. Check debug info at top of page
3. Test quiz flow

## Debug Info
The app now shows:
- API Key status
- Quiz state  
- Loading state

## If Still Not Working
1. Check browser console for errors
2. Verify API key is correct
3. Check Vercel deployment logs
4. Ensure environment variable is set correctly 