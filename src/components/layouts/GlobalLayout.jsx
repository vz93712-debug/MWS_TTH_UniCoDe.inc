import {
  Search,
  Monitor,
  Bookmark,
  Globe,
  Trash2,
  GraduationCap,
  Settings,
  Bell,
  HelpCircle,
  Plus,
  Upload,
  Share2,
  Link2,
  ChevronLeft,
} from "lucide-react";

export function GlobalLayout({ children }) {
  return (
    <div className="flex h-screen w-full bg-white text-[#19191C] font-sans overflow-hidden">
      {/* 1. УЗКАЯ ПАНЕЛЬ НАВИГАЦИИ (Far Left Strip) */}
      <aside className="w-14 flex flex-col items-center py-3 border-r border-gray-200 bg-white shrink-0 z-10 justify-between">
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Логотип / Аватар воркспейса */}
          <button className="w-8 h-8 bg-indigo-500 rounded text-white flex items-center justify-center font-bold text-sm mb-2 hover:bg-indigo-600 transition-colors">
            H
          </button>

          {/* Верхний блок иконок */}
          <button className="text-gray-400 hover:text-gray-800 transition-colors">
            <Search size={20} strokeWidth={1.5} />
          </button>
          <button className="text-indigo-500 bg-indigo-50 w-10 h-10 rounded-lg flex items-center justify-center transition-colors">
            <Monitor size={20} strokeWidth={1.5} />
          </button>
          <button className="text-gray-400 hover:text-gray-800 transition-colors">
            <Bookmark size={20} strokeWidth={1.5} />
          </button>
          <button className="text-gray-400 hover:text-gray-800 transition-colors">
            <Globe size={20} strokeWidth={1.5} />
          </button>
          <button className="text-gray-400 hover:text-gray-800 transition-colors">
            <Trash2 size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Нижний блок иконок */}
        <div className="flex flex-col items-center gap-5 w-full mb-2">
          <button className="text-gray-400 hover:text-gray-800 transition-colors">
            <GraduationCap size={20} strokeWidth={1.5} />
          </button>
          <button className="text-gray-400 hover:text-gray-800 transition-colors">
            <Settings size={20} strokeWidth={1.5} />
          </button>
          <button className="text-gray-400 hover:text-gray-800 transition-colors">
            <Bell size={20} strokeWidth={1.5} />
          </button>
          <button className="text-gray-400 hover:text-gray-800 transition-colors">
            <HelpCircle size={20} strokeWidth={1.5} />
          </button>
          {/* Аватар юзера */}
          <button className="w-8 h-8 bg-red-500 rounded-full text-white flex items-center justify-center font-bold text-xs mt-2">
            K
          </button>
        </div>
      </aside>

      {/* 2. ПАНЕЛЬ ПРОСТРАНСТВА (Secondary Sidebar) */}
      <aside className="w-[280px] border-r border-gray-200 flex flex-col bg-white shrink-0 z-10 justify-between">
        <div>
          {/* Заголовок */}
          <div className="h-14 flex items-center justify-between px-4">
            <h2 className="font-semibold text-[15px]">Название пространства</h2>
            <button className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors">
              <Search size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Поиск */}
          <div className="px-4 pb-4">
            <input
              type="text"
              placeholder="Поиск по пространству..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-400"
            />
          </div>

          {/* Тут будет дерево документов, пока пусто, как на макете */}
        </div>

        {/* Кнопки Создать / Импорт внизу */}
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button className="flex-1 bg-[#E33A3A] hover:bg-red-600 text-white text-sm font-medium py-2 rounded flex items-center justify-center gap-1.5 transition-colors">
            <Plus size={16} /> Создать
          </button>
          <button className="flex-1 border border-[#E33A3A] text-[#E33A3A] hover:bg-red-50 text-sm font-medium py-2 rounded flex items-center justify-center gap-1.5 transition-colors">
            <Upload size={16} /> Импорт
          </button>
        </div>
      </aside>

      {/* 3. ОСНОВНАЯ РАБОЧАЯ ОБЛАСТЬ (Main Area) */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Кнопка скрытия сайдбара (наползает на границу) */}
        <button className="absolute left-0 top-14 -translate-x-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 shadow-sm z-20">
          <ChevronLeft size={14} />
        </button>

        {/* ВЕРХНЯЯ ПАНЕЛЬ (Top Bar) */}
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          {/* Хлебные крошки */}
          <div className="flex items-center text-[13px] text-gray-500">
            <span className="hover:text-gray-800 cursor-pointer">
              Пространства
            </span>
            <span className="mx-2 text-gray-300">/</span>
            <span className="hover:text-gray-800 cursor-pointer">
              Название пространства
            </span>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-gray-800 font-medium">.....</span>
          </div>

          {/* Правый блок с кнопками */}
          <div className="flex items-center gap-4">
            {/* Аватары */}
            <div className="flex -space-x-1">
              <div className="w-7 h-7 rounded-full border-2 border-white bg-green-600 flex items-center justify-center text-white text-[11px] font-bold z-10">
                K
              </div>
              <div className="w-7 h-7 rounded-full border-2 border-white bg-red-600 flex items-center justify-center text-white text-[11px] font-bold z-0">
                A
              </div>
            </div>

            {/* Кнопка Поделиться */}
            <button className="bg-[#E33A3A] hover:bg-red-600 text-white text-sm font-medium px-4 py-1.5 rounded transition-colors">
              Поделиться
            </button>

            {/* Иконка ссылки */}
            <button className="text-gray-400 hover:text-gray-800 transition-colors">
              <Link2 size={18} strokeWidth={2} />
            </button>
          </div>
        </header>

        {/* КОНТЕЙНЕР ДЛЯ РЕДАКТОРА (Здесь будет фиксированный тулбар и сам текст) */}
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
