import clsx from 'clsx';

export function Badge({ children, color = 'gray' }) {
  const colors = {
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-indigo-100 text-indigo-700',
    gray: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}