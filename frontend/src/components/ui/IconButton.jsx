import clsx from "clsx";

export function IconButton({
  icon,
  isActive,
  className,
  size = "md",
  ...props
}) {
  const sizes = {
    sm: "p-1 rounded",
    md: "p-1.5 rounded-md",
  };

  return (
    <button
      className={clsx(
        "flex items-center justify-center transition-colors focus:outline-none",
        sizes[size],
        isActive
          ? "bg-gray-100 text-gray-900"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
