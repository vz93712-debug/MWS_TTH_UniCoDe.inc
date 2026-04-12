import { RotateCcw } from 'lucide-react';
import { Drawer } from './Drawer';
import { Avatar } from '../../ui/Avatar';

const HISTORY = [
  { id: 1, date: 'Сегодня, 15:42', author: 'Анна В.', initials: 'АВ', color: 'bg-green-500', current: true },
  { id: 2, date: 'Сегодня, 11:20', author: 'Константин А.', initials: 'КА', color: 'bg-red-500', current: false },
  { id: 3, date: 'Вчера, 18:05', author: 'Анна В.', initials: 'АВ', color: 'bg-green-500', current: false },
];

export function HistoryDrawer({ isOpen, onClose }) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="История версий">
      <div className="p-6 h-full overflow-y-auto">
        
        {/* Контейнер таймлайна с линией */}
        <div className="relative border-l border-gray-200 ml-4 space-y-8 pb-4">
          
          {HISTORY.map((item) => (
            <div key={item.id} className="relative pl-6 group cursor-pointer">
              
              {/* Точка на линии */}
              <div className={`absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full border-2 border-white ${item.current ? 'bg-[#E33A3A] shadow-[0_0_0_2px_rgba(227,58,58,0.2)]' : 'bg-gray-300'}`} />
              
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-sm font-semibold ${item.current ? 'text-[#E33A3A]' : 'text-gray-900'}`}>
                    {item.date} 
                    {item.current && <span className="text-[10px] font-normal text-red-400 ml-1">(Текущая)</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar initials={item.initials} colorClass={item.color} size="sm" />
                    <span className="text-xs text-gray-600">{item.author}</span>
                  </div>
                </div>
                
                {/* Кнопка "Восстановить" (видна только по ховеру на старых версиях) */}
                {!item.current && (
                  <button className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1.5 bg-white border border-gray-200 shadow-sm rounded-md text-[11px] font-medium text-gray-700 hover:text-[#E33A3A] hover:border-red-200 transition-all">
                    <RotateCcw size={12} />
                    Восстановить
                  </button>
                )}
              </div>
            </div>
          ))}
          
        </div>
      </div>
    </Drawer>
  );
}