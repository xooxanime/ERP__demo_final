import { cn, getInitials } from '../../lib/utils';

function Avatar({ src, name, size = 'md', className }) {
  const sizes = { xs: 'h-6 w-6 text-xs', sm: 'h-8 w-8 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-11 w-11 text-base', xl: 'h-14 w-14 text-lg' };
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;

  return (
    <div className={cn('relative inline-flex items-center justify-center rounded-full font-semibold text-white flex-shrink-0', sizes[size], !src && colors[colorIdx], className)}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <span>{getInitials(name)}</span>
      )}
      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
    </div>
  );
}

export { Avatar };
export default Avatar;
