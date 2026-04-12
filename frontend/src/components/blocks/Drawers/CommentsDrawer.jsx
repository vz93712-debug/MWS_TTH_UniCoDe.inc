import { Check, Send } from 'lucide-react';
import { Drawer } from './Drawer';
import { Avatar } from '../../ui/Avatar';

export function CommentsDrawer({ isOpen, onClose }) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Комментарии">
      <div className="flex flex-col h-full bg-gray-50/30">
        
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {/* Карточка комментария */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 relative group transition-shadow hover:shadow-md">
            <button 
              className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors opacity-0 group-hover:opacity-100" 
              title="Отметить как решенное"
            >
              <Check size={14} />
            </button>
            
            {/* Цитата из текста */}
            <div className="border-l-2 border-[#E33A3A] pl-3 mb-3 text-sm text-gray-500 italic line-clamp-2">
              "архитектура эндпоинтов делится на три слоя"
            </div>
            
            {/* Автор и текст */}
            <div className="flex items-start gap-3">
              <Avatar initials="КА" colorClass="bg-red-500" size="sm" />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-gray-900">Константин А.</span>
                  <span className="text-[10px] text-gray-400">12:30</span>
                </div>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                  Может добавим кэширование на уровне Gateway для ускорения ответа?
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Инпут снизу */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Написать комментарий..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-[#E33A3A] focus:ring-1 focus:ring-[#E33A3A] transition-all" 
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors shadow-sm">
              <Send size={14} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}