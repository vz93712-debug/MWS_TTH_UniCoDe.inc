import { 
  Type, ChevronDown, List, Hash, DollarSign, 
  Percent, Calendar, Paperclip, User, CheckSquare, Star 
} from 'lucide-react';

const TYPES = [
  { id: 'text', icon: Type, label: 'Обычный текст' },
  { id: 'select', icon: ChevronDown, label: 'Выбор' },
  { id: 'multi', icon: List, label: 'Множественный выбор' },
  { id: 'number', icon: Hash, label: 'Номер' },
  { id: 'currency', icon: DollarSign, label: 'Валюта' },
  { id: 'percent', icon: Percent, label: 'Процент' },
  { id: 'date', icon: Calendar, label: 'Дата' },
  { id: 'attachment', icon: Paperclip, label: 'Вложение' },
  { id: 'user', icon: User, label: 'Участник' },
  { id: 'checkbox', icon: CheckSquare, label: 'Чекбокс' },
  { id: 'rating', icon: Star, label: 'Рейтинг' },
];

export function FieldTypeMenu() {
  return (
    <div className="w-60 bg-white border border-gray-100 rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] py-1.5 max-h-[320px] overflow-y-auto font-sans">
      {TYPES.map((item) => (
        <button
          key={item.id}
          className="w-full flex items-center gap-3 px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors text-gray-700"
        >
          <div className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 bg-white shadow-sm shrink-0">
            <item.icon size={14} className="text-gray-500" />
          </div>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}