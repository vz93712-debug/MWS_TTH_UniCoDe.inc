import { useState } from "react";
import {
  MessageSquare,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  Check,
  X,
} from "lucide-react";

export function FloatingToolbar({ selectionState, onAction }) {
  // Состояние для переключения между кнопками и полем ввода ссылки
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  // Интерфейс ввода ссылки (когда нажали на иконку скрепки)
  if (isLinkEditMode) {
    return (
      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-150">
        <input
          autoFocus
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="Введите ссылку (https://...)"
          className="text-sm outline-none w-56 text-gray-700 bg-transparent"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onAction("link", linkUrl);
              setIsLinkEditMode(false);
            }
            if (e.key === "Escape") setIsLinkEditMode(false);
          }}
        />
        <button
          onClick={() => {
            onAction("link", linkUrl);
            setIsLinkEditMode(false);
          }}
          className="text-green-600 hover:bg-green-50 p-1 rounded-md transition-colors"
          title="Применить"
        >
          <Check size={16} />
        </button>
        <button
          onClick={() => {
            onAction("link", null);
            setIsLinkEditMode(false);
          }}
          className="text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors"
          title="Удалить ссылку"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  // Стандартный интерфейс плавающего меню
  return (
    <div className="flex items-center bg-white px-2 py-1.5 rounded-xl shadow-2xl border border-gray-200 gap-1 animate-in fade-in zoom-in duration-150">
      <button
        onClick={() => document.dispatchEvent(new CustomEvent("OPEN_COMMENTS"))}
        className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
      >
        <MessageSquare size={16} className="text-gray-400" /> Комментировать
      </button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <select
        onChange={(e) => onAction("fontFamily", e.target.value)}
        className="text-[13px] font-bold text-gray-800 bg-transparent outline-none cursor-pointer px-2 py-1 appearance-none hover:text-[#FF0032]"
      >
        <option value='"MTS Compact", sans-serif'>MTS Compact</option>
        <option value='"MTS Wide", sans-serif'>MTS Wide</option>
      </select>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <button
        onClick={() => onAction("strikethrough")}
        className={`p-1.5 rounded-md transition-colors ${selectionState.isStrikethrough ? "bg-[#FFEBED] text-[#FF0032]" : "text-gray-500 hover:bg-gray-50"}`}
      >
        <span className="font-serif font-bold text-sm line-through">AB</span>
      </button>
      <button
        onClick={() => onAction("bold")}
        className={`p-1.5 rounded-md transition-colors ${selectionState.isBold ? "bg-[#FFEBED] text-[#FF0032]" : "text-gray-500 hover:bg-gray-50"}`}
      >
        <Bold size={16} strokeWidth={3} />
      </button>
      <button
        onClick={() => onAction("italic")}
        className={`p-1.5 rounded-md transition-colors ${selectionState.isItalic ? "bg-[#FFEBED] text-[#FF0032]" : "text-gray-500 hover:bg-gray-50"}`}
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => setIsLinkEditMode(true)}
        className={`p-1.5 rounded-md transition-colors ${selectionState.isLink ? "bg-[#FFEBED] text-[#FF0032]" : "text-gray-500 hover:bg-gray-50"}`}
      >
        <LinkIcon size={16} />
      </button>
      <button
        onClick={() => onAction("ul")}
        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <List size={16} />
      </button>
    </div>
  );
}
