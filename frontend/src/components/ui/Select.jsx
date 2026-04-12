import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export function Select({ options = [], className, disabled, ...props }) {
  return (
    <div className="relative w-full">
      <select
        disabled={disabled}
        className={clsx(
          "w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm transition-colors",
          "focus:border-[#E33A3A] focus:outline-none focus:ring-1 focus:ring-[#E33A3A]",
          "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown 
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" 
        size={16} 
      />
    </div>
  );
}