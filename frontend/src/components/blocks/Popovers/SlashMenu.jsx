import { 
  Type, Heading1, Heading2, Heading3, 
  ListOrdered, List, CheckSquare, Code, Quote, Table 
} from 'lucide-react';
import clsx from 'clsx';

const MENU_ITEMS = [
  // Заголовок группы, как на макете
  { type: 'header', label: 'Базовые блоки' },
  { id: 'text', icon: Type, label: 'Обычный текст' },
  { id: 'h1', icon: Heading1, label: 'Заголовок 1' },
  { id: 'h2', icon: Heading2, label: 'Заголовок 2' },
  { id: 'h3', icon: Heading3, label: 'Заголовок 3' },
  { id: 'ul', icon: List, label: 'Маркированный список' },
  { id: 'ol', icon: ListOrdered, label: 'Нумерованный список' },
  { id: 'check', icon: CheckSquare, label: 'Чеклист' },
  { id: 'code', icon: Code, label: 'Код' },
  { id: 'quote', icon: Quote, label: 'Цитата' },
  { id: 'table', icon: Table, label: 'Таблица' },
];

export function SlashMenu() {
  return (
    <div className="w-[280px] bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-2.5 font-sans flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
      {MENU_ITEMS.map((item, idx) => {
        if (item.type === 'header') {
          return (
            <div key={idx} className="px-4 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {item.label}
            </div>
          );
        }

        return (
          <button
            key={item.id}
            className="w-[calc(100%-16px)] mx-auto flex items-center gap-3.5 px-3 py-2 text-sm text-[#19191C] hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
          >
            {/* Иконка (серая на макете) */}
            <div className="text-gray-400 shrink-0">
              <item.icon size={18} strokeWidth={2} />
            </div>
            {/* Текст (Medium) */}
            <span className="font-medium text-[15px]">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}