import clsx from 'clsx';

export function Skeleton({ variant = 'text', className = '' }) {
  const baseClasses = "animate-pulse bg-gray-200";
  
  if (variant === 'text') {
    return <div className={`${baseClasses} h-4 w-full rounded ${className}`} />;
  }
  
  if (variant === 'block') {
    return <div className={`${baseClasses} h-32 w-full rounded-xl ${className}`} />;
  }

  return null;
}