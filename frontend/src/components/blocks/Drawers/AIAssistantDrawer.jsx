import { Sparkles, Send } from 'lucide-react';
import { Drawer } from './Drawer';

export function AIAssistantDrawer({ isOpen, onClose }) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="AI-Ассистент">
      <div className="flex flex-col h-full">
        
        {/* История чата */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50/50">
          
          {/* Сообщение от AI - МЕНЯЕМ ФОН АВАТАРА И ОБВОДКУ */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles size={16} />
            </div>
            <div className="bg-white border border-red-100 shadow-sm rounded-2xl rounded-tl-sm p-4 text-sm text-gray-800 leading-relaxed">
              Привет! Я твой AI-помощник MWS. Я прочитал этот документ, чем могу помочь?
            </div>
          </div>

          {/* Сообщение от Юзера */}
          <div className="flex gap-3 flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-gray-600 text-[10px] font-bold">
              ВЫ
            </div>
            <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-tr-sm p-4 text-sm text-gray-800 leading-relaxed">
              Сделай краткое саммари этого текста, выдели главные тезисы.
            </div>
          </div>

        </div>

        {/* Область ввода - МЕНЯЕМ ЦВЕТА ЧИПСОВ И КНОПКИ */}
        <div className="p-4 border-t border-divider bg-white">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            <button className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#E33A3A] text-xs font-medium rounded-full whitespace-nowrap transition-colors border border-red-100">
              <Sparkles size={12} className="inline mr-1 mb-0.5" />
              Сделай саммари
            </button>
            <button className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium rounded-full whitespace-nowrap transition-colors border border-gray-200">
              Проверь ошибки
            </button>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Спроси о чем угодно..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-300 transition-all"
            />
            {/* Кнопка отправки - ЧЕРНАЯ, как в Дашборде */}
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors shadow-sm">
              <Send size={14} className="ml-0.5" />
            </button>
          </div>
        </div>

      </div>
    </Drawer>
  );
}