export default {
  plugins: {
    // use Tailwind via its new PostCSS adapter package:
    '@tailwindcss/postcss': {},
    // (and your nesting / autoprefixer, etc)
    'postcss-nesting': {},
    autoprefixer: {},
  },
}