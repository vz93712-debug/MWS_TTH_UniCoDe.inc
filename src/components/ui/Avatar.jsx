import clsx from "clsx";

export function Avatar({
  initials,
  colorClass = "bg-gray-500",
  size = "md",
  className,
}) {
  const sizes = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-7 h-7 text-[11px]",
    lg: "w-8 h-8 text-xs",
  };

  return (
    <div
      className={clsx(
        "rounded-full flex items-center justify-center text-white font-bold shrink-0",
        sizes[size],
        colorClass,
        className,
      )}
    >
      {initials}
    </div>
  );
}

// Обертка для наложения аватарок друг на друга (как в Top Bar)
export function AvatarGroup({ children, className }) {
  return (
    <div className={clsx("flex -space-x-1.5", className)}>
      {/* Клонируем детей, чтобы добавить им белую обводку для эффекта наложения */}
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              className="ring-2 ring-white rounded-full z-10 relative"
              style={{ zIndex: 10 - i }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}
