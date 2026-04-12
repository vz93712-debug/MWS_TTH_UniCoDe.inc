import { 
  Plus, LayoutTemplate, Upload, FileText, 
  MoreHorizontal, Clock, Table as TableIcon 
} from 'lucide-react';

// Моковые данные для сетки документов
const RECENT_DOCS = [
  { id: 1, title: 'Архитектура MWS API', type: 'page', time: 'Открыто 2ч назад', icon: FileText },
  { id: 2, title: 'План запуска Q3', type: 'table', time: 'Открыто 4ч назад', icon: TableIcon },
  { id: 3, title: 'Заметки с хакатона', type: 'page', time: 'Вчера', icon: FileText },
  { id: 4, title: 'Бюджет маркетинга', type: 'table', time: 'Вчера', icon: TableIcon },
];

export function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto py-12 px-8 font-sans text-[#19191C]">
      
      {/* 1. Шапка (Hero Section) */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Доброе утро, Команда ☀️</h1>
        <p className="text-gray-500 flex items-center gap-2 text-sm">
          <Clock size={16} /> Сегодня, 11 апреля
        </p>
      </div>

      {/* 2. Быстрые действия (Quick Actions) */}
      <div className="mb-12">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <button className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-200 rounded-xl hover:border-[#E33A3A] hover:shadow-[0_4px_20px_-4px_rgba(227,58,58,0.1)] transition-all group">
            <div className="w-12 h-12 bg-red-50 text-[#E33A3A] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <span className="font-medium text-sm text-gray-900">Создать пустую страницу</span>
          </button>

          <button className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <LayoutTemplate size={24} />
            </div>
            <span className="font-medium text-sm text-gray-900">Создать из шаблона</span>
          </button>

          <button className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={24} />
            </div>
            <span className="font-medium text-sm text-gray-900">Импорт файла</span>
          </button>

        </div>
      </div>

      {/* 3. Блок "Недавно просмотренные" */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Недавно просмотренные</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {RECENT_DOCS.map(doc => (
            <div key={doc.id} className="group cursor-pointer">
              
              {/* Превью документа */}
              <div className="h-32 bg-gray-50 border border-gray-200 rounded-xl mb-3 relative overflow-hidden group-hover:border-gray-300 group-hover:shadow-sm transition-all">
                <div className="absolute inset-4 bg-white rounded border border-gray-200 opacity-60 shadow-sm"></div>
                
                {/* Кнопка "Три точки" появляется только при ховере */}
                <button className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 rounded shadow-sm opacity-0 group-hover:opacity-100 hover:bg-gray-50 transition-all z-10">
                  <MoreHorizontal size={16} className="text-gray-600" />
                </button>
              </div>
              
              {/* Инфо о документе */}
              <div className="flex items-start gap-2 px-1">
                <div className="mt-0.5">
                  <doc.icon size={16} className={doc.type === 'table' ? 'text-indigo-500' : 'text-gray-400'} />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-900 line-clamp-1">{doc.title}</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">{doc.time}</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}