// src/PlatformLogos.jsx
// Stylized, hand-drawn badge icons for the streaming services SwipeFlix
// supports as filters. Not pixel copies of official marks — simplified
// shapes + brand colors so they read instantly at small sizes.

const BADGES = {
  netflix: { bg: '#E50914', content: (
    <text x="12" y="17" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fff" fontFamily="Georgia, serif">N</text>
  ) },
  prime: { bg: 'linear-gradient(135deg,#00A8E1,#0073A8)', content: (
    <path d="M6 8 L15 12 L6 16 Z" fill="#fff" />
  ) },
  disney: { bg: 'linear-gradient(135deg,#1a2a6c,#0f1e4d)', content: (
    <path d="M12 4l1.6 4.9H19l-4.2 3 1.6 5-4.4-3.1-4.4 3.1 1.6-5-4.2-3h5.4z" fill="#fff" />
  ) },
  hulu: { bg: '#1CE783', content: (
    <text x="12" y="17" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0b3d24" fontFamily="Arial, sans-serif">h</text>
  ) },
  apple: { bg: '#000', content: (
    <path d="M14.8 7.4c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.6-1 2.6 1 .1 2-.5 2.6-1.2zM17 12.4c0-2 1.6-3 1.7-3-.9-1.3-2.3-1.5-2.8-1.5-1.2-.1-2.3.7-2.9.7-.6 0-1.5-.7-2.5-.7-1.3 0-2.5.7-3.1 1.9-1.3 2.3-.3 5.7 1 7.6.6.9 1.4 2 2.4 1.9 1-.1 1.3-.6 2.5-.6s1.5.6 2.5.6c1 0 1.7-.9 2.3-1.9.5-.8.9-1.9.9-1.9s-2-.8-2-3.1z" fill="#fff" />
  ) },
  paramount: { bg: 'linear-gradient(135deg,#0064FF,#003399)', content: (
    <>
      <path d="M12 5 L15.5 15 H8.5 Z" fill="#fff" opacity="0.9" />
      <circle cx="6" cy="16" r="1" fill="#fff" />
      <circle cx="9" cy="16" r="1" fill="#fff" />
      <circle cx="12" cy="16" r="1" fill="#fff" />
      <circle cx="15" cy="16" r="1" fill="#fff" />
      <circle cx="18" cy="16" r="1" fill="#fff" />
    </>
  ) },
};

export default function PlatformLogo({ id, size = 32 }) {
  const badge = BADGES[id];
  if (!badge) return null;
  const isGradient = badge.bg.startsWith('linear-gradient');
  return (
    <div
      className="rounded-lg flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: isGradient ? badge.bg : badge.bg,
        boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
      }}
    >
      <svg width={size * 0.75} height={size * 0.75} viewBox="0 0 24 24">
        {badge.content}
      </svg>
    </div>
  );
}
