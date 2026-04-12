import clsx from 'clsx';

export function Input({ icon, className, disabled, ...props }) {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        disabled={disabled}
        className={clsx(
          "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-colors",
          "focus:border-[#E33A3A] focus:outline-none focus:ring-1 focus:ring-[#E33A3A]",
          "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
          icon ? "pl-10" : "pl-3",
          className
        )}
        {...props}
      />
    </div>
  );
}