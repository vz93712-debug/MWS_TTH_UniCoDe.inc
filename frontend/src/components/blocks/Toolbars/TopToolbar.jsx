import { useState } from "react";
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Droplet,
  MessageSquare,
  History,
} from "lucide-react";

const ToolbarGroup = ({ children }) => (
  <div className="flex items-center border border-gray-200 rounded-md bg-white h-[30px] shrink-0 overflow-hidden shadow-sm">
    {children}
  </div>
);

// ВАЖНО: Добавили onMouseDown вместо onClick
const ToolbarButton = ({
  children,
  isActive,
  onMouseDown,
  className = "",
  title = "",
}) => (
  <button
    onMouseDown={onMouseDown}
    title={title}
    className={`flex items-center justify-center h-full min-w-[30px] px-1.5 hover:bg-gray-50 hover:text-[#FF0032] transition-colors focus:outline-none ${
      isActive ? "bg-[#FFEBED] text-[#FF0032] shadow-inner" : "text-gray-500"
    } ${className}`}
  >
    {children}
  </button>
);

const ToolbarDivider = () => (
  <div className="w-px h-full bg-gray-200 shrink-0" />
);

export function TopToolbar({ formats = {}, onFormat = () => {} }) {
  const [fontSize, setFontSize] = useState(16);

  const handleFontSize = (delta) => {
    const newSize = Math.max(8, Math.min(72, fontSize + delta));
    setFontSize(newSize);
    onFormat("fontSize", `${newSize}px`);
  };

  // Вспомогательная функция для безопасного вызова onFormat без потери фокуса
  const formatSafe = (e, action, value = null) => {
    e.preventDefault(); // НЕ ДАЕТ ПОТЕРЯТЬ ВЫДЕЛЕНИЕ ТЕКСТА
    onFormat(action, value);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white w-full overflow-x-auto font-sans scrollbar-hide">
      {/* 1. Undo / Redo */}
      <div className="flex items-center gap-0.5 shrink-0 text-gray-400">
        <button
          onMouseDown={(e) => formatSafe(e, "undo")}
          title="Отменить"
          className="p-1 hover:text-[#FF0032] hover:bg-gray-50 rounded transition-colors"
        >
          <Undo size={16} />
        </button>
        <button
          onMouseDown={(e) => formatSafe(e, "redo")}
          title="Повторить"
          className="p-1 hover:text-[#FF0032] hover:bg-gray-50 rounded transition-colors"
        >
          <Redo size={16} />
        </button>
      </div>

      <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />

      {/* 2. Шрифт */}
      <ToolbarGroup>
        <select
          onChange={(e) => onFormat("fontFamily", e.target.value)}
          className="text-[13px] font-medium text-gray-700 bg-transparent outline-none cursor-pointer px-2 py-1 appearance-none hover:text-[#FF0032]"
        >
          <option value='"MTS Compact", sans-serif'>MTS Compact</option>
          <option value='"MTS Wide", sans-serif'>MTS Wide</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="monospace">Monospace</option>
        </select>
      </ToolbarGroup>

      {/* 3. Размер шрифта */}
      <ToolbarGroup>
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            handleFontSize(-1);
          }}
          className="px-2 font-bold"
        >
          -
        </ToolbarButton>
        <ToolbarDivider />
        <div className="px-3 text-[13px] font-bold text-gray-700 flex items-center justify-center min-w-[32px]">
          {fontSize}
        </div>
        <ToolbarDivider />
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            handleFontSize(1);
          }}
          className="px-2 font-bold"
        >
          +
        </ToolbarButton>
      </ToolbarGroup>

      {/* 4. СТИЛИ ТЕКСТА */}
      <ToolbarGroup>
        <ToolbarButton
          isActive={formats.isBold}
          onMouseDown={(e) => formatSafe(e, "bold")}
          title="Жирный"
        >
          <Bold size={14} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          isActive={formats.isItalic}
          onMouseDown={(e) => formatSafe(e, "italic")}
          title="Курсив"
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          isActive={formats.isStrikethrough}
          onMouseDown={(e) => formatSafe(e, "strikethrough")}
          title="Зачеркнутый"
        >
          <Strikethrough size={14} />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          isActive={formats.isUnderline}
          onMouseDown={(e) => formatSafe(e, "underline")}
          title="Подчеркнутый"
        >
          <UnderlineIcon size={14} />
        </ToolbarButton>
      </ToolbarGroup>

      {/* 5. Цвета и Очистка (ТЕПЕРЬ РАБОТАЮТ) */}
      <ToolbarGroup>
        <ToolbarButton
          onMouseDown={(e) => formatSafe(e, "clear")}
          title="Очистить стили"
        >
          <span className="text-[13px] font-bold font-serif">T</span>
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarGroup>
        <ToolbarButton
          onMouseDown={(e) => formatSafe(e, "fontColor", "#FF0032")}
          title="Красный текст"
        >
          <span className="text-[13px] font-bold font-serif underline decoration-[#FF0032] underline-offset-2">
            A
          </span>
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarGroup>
        <ToolbarButton
          onMouseDown={(e) => formatSafe(e, "bgColor", "#FFEBED")}
          title="Светло-красный фон"
        >
          <Droplet size={14} />
        </ToolbarButton>
      </ToolbarGroup>

      {/* 6. ЗАГОЛОВКИ */}
      <ToolbarGroup>
        <ToolbarButton onMouseDown={(e) => formatSafe(e, "h1")}>
          <span className="text-[12px] font-medium text-gray-600">
            H<sub className="text-[9px]">1</sub>
          </span>
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton onMouseDown={(e) => formatSafe(e, "h2")}>
          <span className="text-[12px] font-medium text-gray-600">
            H<sub className="text-[9px]">2</sub>
          </span>
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton onMouseDown={(e) => formatSafe(e, "h3")}>
          <span className="text-[12px] font-medium text-gray-600">
            H<sub className="text-[9px]">3</sub>
          </span>
        </ToolbarButton>
      </ToolbarGroup>

      <div className="flex-1 min-w-[20px]"></div>

      {/* 7. ПАНЕЛИ */}
      <ToolbarGroup>
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent("OPEN_COMMENTS"));
          }}
          title="Комментарии"
        >
          <MessageSquare size={14} />
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarGroup>
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent("OPEN_HISTORY"));
          }}
          title="История версий"
        >
          <History size={14} />
        </ToolbarButton>
      </ToolbarGroup>
    </div>
  );
}
