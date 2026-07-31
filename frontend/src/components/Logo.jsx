const Logo = ({ className = "h-12 w-12" }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Globe Background */}
      <circle cx="100" cy="100" r="90" fill="url(#globeGradient)" />
      
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#1E40AF', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FCD34D', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Stars */}
      <circle cx="100" cy="20" r="3" fill="#FCD34D" />
      <circle cx="70" cy="30" r="2.5" fill="#FCD34D" />
      <circle cx="130" cy="30" r="2.5" fill="#FCD34D" />
      <circle cx="50" cy="45" r="2" fill="#FCD34D" />
      <circle cx="150" cy="45" r="2" fill="#FCD34D" />
      
      {/* Open Book */}
      <path 
        d="M 60 120 Q 100 110 140 120 L 140 160 Q 100 150 60 160 Z" 
        fill="#FFFFFF" 
        stroke="#1E40AF" 
        strokeWidth="2"
      />
      <path 
        d="M 100 110 L 100 150" 
        stroke="#1E40AF" 
        strokeWidth="2"
      />
      
      {/* Book Pages Lines */}
      <line x1="70" y1="130" x2="95" y2="127" stroke="#3B82F6" strokeWidth="1" />
      <line x1="70" y1="140" x2="95" y2="137" stroke="#3B82F6" strokeWidth="1" />
      <line x1="105" y1="127" x2="130" y2="130" stroke="#3B82F6" strokeWidth="1" />
      <line x1="105" y1="137" x2="130" y2="140" stroke="#3B82F6" strokeWidth="1" />
      
      {/* Torch */}
      <rect x="95" y="70" width="10" height="30" fill="#8B4513" rx="2" />
      
      {/* Flame */}
      <ellipse cx="100" cy="60" rx="12" ry="18" fill="url(#flameGradient)" />
      <ellipse cx="100" cy="58" rx="8" ry="12" fill="#FEF3C7" />
      
      {/* Globe Lines */}
      <circle cx="100" cy="100" r="90" fill="none" stroke="#60A5FA" strokeWidth="1" opacity="0.3" />
      <ellipse cx="100" cy="100" rx="90" ry="30" fill="none" stroke="#60A5FA" strokeWidth="1" opacity="0.3" />
      <ellipse cx="100" cy="100" rx="30" ry="90" fill="none" stroke="#60A5FA" strokeWidth="1" opacity="0.3" />
    </svg>
  );
};

export default Logo;
