import React, { useEffect, useRef } from "react";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  ListOrdered,
  List,
  CheckSquare,
  Code,
  Quote,
  Table,
} from "lucide-react";

const MENU_ITEMS = [
  { type: "header", label: "Базовые блоки" },
  { id: "text", icon: Type, label: "Обычный текст" },
  { id: "h1", icon: Heading1, label: "Заголовок 1" },
  { id: "h2", icon: Heading2, label: "Заголовок 2" },
  { id: "h3", icon: Heading3, label: "Заголовок 3" },
  { id: "ul", icon: List, label: "Маркированный список" },
  { id: "ol", icon: ListOrdered, label: "Нумерованный список" },
  { id: "check", icon: CheckSquare, label: "Чеклист" },
  { id: "code", icon: Code, label: "Код" },
  { id: "quote", icon: Quote, label: "Цитата" },
  // Немного изменили ID и название для нашей кастомной таблицы
  { id: "mws-table", icon: Table, label: "Таблица MWS" },
];

// ДОБАВИЛИ ПРОПСЫ: isOpen, x, y, onClose, onSelect
export function SlashMenu({ isOpen, x, y, onClose, onSelect }) {
  const menuRef = useRef(null);

  // Закрываем меню при клике вне его области
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }} // ПОЗИЦИОНИРУЕМ ПОД КУРСОР
      className="absolute z-50 w-[280px] bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-2.5 font-sans flex flex-col gap-0.5 max-h-[300px] overflow-y-auto"
    >
      {MENU_ITEMS.map((item, idx) => {
        if (item.type === "header") {
          return (
            <div
              key={idx}
              className="px-4 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider"
            >
              {item.label}
            </div>
          );
        }

        return (
          <button
            key={item.id}
            // ВЕШАЕМ ВСЁ НА ОДНО СОБЫТИЕ:
            onMouseDown={(e) => {
              e.preventDefault(); // Не даем редактору потерять фокус
              e.stopPropagation();
              onSelect(item.id); // Сразу вызываем функцию
            }}
            // onClick УБРАЛИ ПОЛНОСТЬЮ
            className="w-[calc(100%-16px)] mx-auto flex items-center gap-3.5 px-3 py-2 text-sm text-[#19191C] hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
          >
            <div className="text-gray-400 shrink-0">
              <item.icon size={18} strokeWidth={2} />
            </div>
            <span className="font-medium text-[15px]">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
