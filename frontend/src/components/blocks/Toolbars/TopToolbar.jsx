
import { 
  Undo, Redo, ChevronDown, Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  Droplet, AlignLeft, AlignCenter, AlignRight, ListOrdered, List, CheckSquare, 
  AtSign, Code, Quote, Table, Image as ImageIcon, MessageSquare, History 
} from 'lucide-react';

// Микро-компонент: Обертка с рамкой
const ToolbarGroup = ({ children }) => (
  <div className="flex items-center border border-gray-200 rounded-md bg-white h-[30px] shrink-0 overflow-hidden shadow-sm">
    {children}
  </div>
);

// Микро-компонент: Сама кнопка
const ToolbarButton = ({ children, isActive, className = "" }) => (
  <button className={`flex items-center justify-center h-full min-w-[30px] px-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none ${isActive ? 'bg-gray-100 text-gray-900' : ''} ${className}`}>
    {children}
  </button>
);

// Микро-компонент: Вертикальный разделитель ВНУТРИ рамки
const ToolbarDivider = () => (
  <div className="w-px h-full bg-gray-200 shrink-0" />
);

export function TopToolbar() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl w-full overflow-x-auto font-sans shadow-sm scrollbar-hide">
      
      {/* 1. Undo / Redo (без рамок) */}
      <div className="flex items-center gap-0.5 shrink-0 text-gray-400">
        <button className="p-1 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"><Undo size={16} /></button>
        <button className="p-1 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"><Redo size={16} /></button>
      </div>

      <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />

      {/* 2. Шрифт */}
      <ToolbarGroup>
        <ToolbarButton className="gap-1 px-3">
          <span className="text-[13px] font-medium text-gray-700">Open Sans</span>
          <ChevronDown size={14} className="text-gray-400" />
        </ToolbarButton>
      </ToolbarGroup>

      {/* 3. Размер */}
      <ToolbarGroup>
        <ToolbarButton className="px-2">-</ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton className="px-3 text-[13px] font-bold text-gray-700">16</ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton className="px-2">+</ToolbarButton>
      </ToolbarGroup>

      {/* 4. Стили текста (B, I, S, U) */}
      <ToolbarGroup>
        <ToolbarButton isActive><Bold size={14} strokeWidth={2.5} /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton><Italic size={14} /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton><Strikethrough size={14} /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton><UnderlineIcon size={14} /></ToolbarButton>
      </ToolbarGroup>

      {/* 5. Цвета (отдельные рамки) */}
      <ToolbarGroup><ToolbarButton><span className="text-[13px] font-bold font-serif">T</span></ToolbarButton></ToolbarGroup>
      <ToolbarGroup><ToolbarButton><span className="text-[13px] font-bold font-serif underline decoration-[#E33A3A] underline-offset-2">A</span></ToolbarButton></ToolbarGroup>
      <ToolbarGroup><ToolbarButton><Droplet size={14} /></ToolbarButton></ToolbarGroup>

      {/* 6. Заголовки */}
      <ToolbarGroup>
        <ToolbarButton><span className="text-[12px] font-medium text-gray-600">H<sub className="text-[9px]">1</sub></span></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton><span className="text-[12px] font-medium text-gray-600">H<sub className="text-[9px]">2</sub></span></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton><span className="text-[12px] font-medium text-gray-600">H<sub className="text-[9px]">3</sub></span></ToolbarButton>
      </ToolbarGroup>

      {/* 7. Выравнивание */}
      <ToolbarGroup>
        <ToolbarButton isActive><AlignLeft size={14} /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton><AlignCenter size={14} /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton><AlignRight size={14} /></ToolbarButton>
      </ToolbarGroup>

      {/* 8. Списки */}
      <ToolbarGroup>
        <ToolbarButton><ListOrdered size={14} /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton><List size={14} /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton><CheckSquare size={14} /></ToolbarButton>
      </ToolbarGroup>

      {/* 9. Вставки (отдельные рамки) */}
      <ToolbarGroup><ToolbarButton><AtSign size={14} /></ToolbarButton></ToolbarGroup>
      <ToolbarGroup><ToolbarButton><Code size={14} /></ToolbarButton></ToolbarGroup>
      <ToolbarGroup><ToolbarButton><Quote size={14} /></ToolbarButton></ToolbarGroup>
      <ToolbarGroup><ToolbarButton><Table size={14} /></ToolbarButton></ToolbarGroup>
      <ToolbarGroup><ToolbarButton><ImageIcon size={14} /></ToolbarButton></ToolbarGroup>

      {/* Распорка (отодвигает всё остальное вправо) */}
      <div className="flex-1 min-w-[20px]"></div>

      {/* 10. Комменты и История */}
      <ToolbarGroup><ToolbarButton><MessageSquare size={14} /></ToolbarButton></ToolbarGroup>
      <ToolbarGroup><ToolbarButton><History size={14} /></ToolbarButton></ToolbarGroup>

    </div>
  );
}