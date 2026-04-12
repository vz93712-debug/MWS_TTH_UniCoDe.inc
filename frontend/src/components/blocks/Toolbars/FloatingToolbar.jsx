import { 
  Bold, Italic, Link2, MessageSquare, 
  CaseUpper, ChevronDown, List 
} from 'lucide-react';
import { IconButton } from '../../ui/IconButton';

export function FloatingToolbar() {
  return (
    <div className="w-max bg-white border border-gray-200 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-1 flex items-center gap-0.5 font-sans">
      
      {/* Кнопка "Комментировать" с иконкой, как на макете */}
      <button className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none">
        <MessageSquare size={16} className="text-gray-400" />
        <span className="text-sm font-medium">Комментировать</span>
      </button>

      <div className="w-px h-6 bg-gray-100 mx-1" />

      {/* Выбор шрифта (Скрин: Open Sans -> переделаем под MTS) */}
      <button className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-gray-100 rounded-lg group">
        <span className="font-semibold text-gray-900">MTS Wide</span>
        <ChevronDown size={14} className="text-gray-400 mt-0.5" />
      </button>

      <div className="w-px h-6 bg-gray-100 mx-1" />

      {/* Базовое форматирование */}
      <IconButton icon={<CaseUpper size={16} />} />
      <IconButton icon={<Bold size={16} />} isActive={true} />
      <IconButton icon={<Italic size={16} />} />
      <IconButton icon={<Link2 size={16} />} />
      
      {/* Тип списка */}
      <IconButton icon={<List size={16} />} />
    </div>
  );
}