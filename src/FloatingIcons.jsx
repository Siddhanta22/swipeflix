// src/FloatingIcons.jsx
// Ambient floating movie-themed icons used behind the home and quiz screens.
const ICONS = [
  { emoji: '🍿', top: '12%', left: '8%', size: 44, glow: '#fff8', duration: 7, delay: 0 },
  { emoji: '🎬', top: '18%', right: '10%', size: 38, glow: '#7f5fff8c', duration: 8, delay: 0.5 },
  { emoji: '⭐', bottom: '16%', left: '14%', size: 36, glow: '#FFD7008c', duration: 6.5, delay: 1 },
  { emoji: '🎞️', bottom: '12%', right: '12%', size: 40, glow: '#3ddad7a0', duration: 7.5, delay: 1.5 },
  { emoji: '✨', top: '8%', right: '22%', size: 28, glow: '#fff8', duration: 3, delay: 0, twinkle: true },
  { emoji: '✨', bottom: '8%', left: '24%', size: 24, glow: '#fff8', duration: 2.6, delay: 0.8, twinkle: true },
];

export default function FloatingIcons({ dim = false }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {ICONS.map((icon, i) => (
        <span
          key={i}
          className={icon.twinkle ? 'animate-twinkle' : 'animate-float'}
          style={{
            position: 'absolute',
            top: icon.top,
            bottom: icon.bottom,
            left: icon.left,
            right: icon.right,
            fontSize: icon.size,
            opacity: dim ? (icon.twinkle ? 0.2 : 0.3) : (icon.twinkle ? 0.6 : 0.8),
            filter: `drop-shadow(0 2px 8px ${icon.glow})`,
            animationDuration: `${icon.duration}s`,
            animationDelay: `${icon.delay}s`,
          }}
        >
          {icon.emoji}
        </span>
      ))}
    </div>
  );
}
