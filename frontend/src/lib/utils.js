import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(new Date(date));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount);
}

export function formatRelativeTime(date) {
  if (!date) return '—';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function truncate(str, length = 40) {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getFileUrl(input) {
  if (!input) return '';
  let url = input;
  if (typeof input === 'object') {
    url = input.url || input.fileUrl || input.path || '';
  }
  if (typeof url !== 'string' || !url.trim()) return '';

  // Filter out broken Cloudinary demo URLs
  if (url.includes('res.cloudinary.com/demo')) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  let baseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
    : '';

  if (!baseUrl && typeof window !== 'undefined') {
    baseUrl = `${window.location.protocol}//${window.location.hostname}:10000`;
  }

  return `${baseUrl}${cleanPath}`;
}

export function openOrDownloadFile(input, fileName = '') {
  const targetUrl = getFileUrl(input);
  if (!targetUrl) return false;

  const resolvedName = fileName || (typeof input === 'object' ? (input.name || input.title) : '') || targetUrl.split('/').pop();
  const ext = (resolvedName.includes('.') ? resolvedName.split('.').pop() : targetUrl.split('.').pop() || '').split('?')[0].toLowerCase();
  
  const browserCanPreview = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'mp4', 'webm', 'mp3', 'wav', 'ogg', 'txt', 'json'].includes(ext);

  if (browserCanPreview) {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  } else {
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = resolvedName || `file.${ext || 'dat'}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  return true;
}
