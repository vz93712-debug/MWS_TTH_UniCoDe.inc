import clsx from "clsx";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  icon,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center gap-1.5 font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500";

  const variants = {
    primary:
      "bg-[#E33A3A] hover:bg-red-600 text-white border border-transparent",
    outline: "bg-white border border-[#E33A3A] text-[#E33A3A] hover:bg-red-50",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
  };

  const sizes = {
    sm: "text-xs px-2.5 py-1.5",
    md: "text-sm px-4 py-2",
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </button>
  );
}
