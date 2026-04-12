import { Search, Monitor, Bookmark, Globe, Trash2, Plus, ArrowRight, FileText, Table as TableIcon } from 'lucide-react';

export function CommandPalette({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#19191C]/90 backdrop-blur-md font-sans text-white flex flex-col items-center pt-[15vh]">
      <div className="absolute inset-0 z-0 cursor-pointer" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center px-6">
        
        {/* Верхние иконки */}
        <div className="flex items-center gap-6 mb-10 opacity-70">
          <button className="w-10 h-10 flex items-center justify-center font-bold text-lg bg-white/10 rounded-full hover:bg-white/20 transition-colors">H</button>
          <button className="text-white/50 hover:text-white transition-colors"><Search size={24} /></button>
          <button className="text-white/50 hover:text-white transition-colors"><Monitor size={24} /></button>
          <button className="text-white/50 hover:text-white transition-colors"><Bookmark size={24} /></button>
          <button className="text-white/50 hover:text-white transition-colors"><Globe size={24} /></button>
          <button className="text-white/50 hover:text-white transition-colors"><Trash2 size={24} /></button>
        </div>

        {/* Поиск */}
        <div className="w-full relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search size={32} className="text-white/40 group-focus-within:text-white transition-colors" />
          </div>
          <input 
            type="text" 
            autoFocus
            placeholder="Поиск по пространству..." 
            className="w-full bg-transparent border-b-2 border-white/20 focus:border-[#E33A3A] py-6 pl-16 pr-6 text-4xl text-white placeholder:text-white/30 focus:outline-none transition-colors"
          />
        </div>

        {/* СТРОГО ПО БЭКЛОГУ: Список моковых результатов */}
        <div className="w-full mt-6 bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          {/* Категория: Страницы */}
          <div className="px-5 py-2 text-[11px] font-bold text-white/40 uppercase tracking-wider bg-white/5">
            Страницы
          </div>
          <button className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/10 transition-colors text-left group">
            <FileText size={18} className="text-white/40 group-hover:text-white transition-colors" />
            <span className="font-medium text-sm">Архитектура MWS API</span>
          </button>
          <button className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/10 transition-colors text-left group">
            <FileText size={18} className="text-white/40 group-hover:text-white transition-colors" />
            <span className="font-medium text-sm">Заметки с хакатона</span>
          </button>

          {/* Категория: Таблицы */}
          <div className="px-5 py-2 text-[11px] font-bold text-white/40 uppercase tracking-wider bg-white/5 border-t border-white/10">
            Таблицы MWS
          </div>
          <button className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/10 transition-colors text-left group">
            <TableIcon size={18} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            <span className="font-medium text-sm">План запуска Q3</span>
          </button>
        </div>

        {/* Кнопки под инпутом */}
        <div className="w-full flex items-center gap-4 mt-6 opacity-80">
          <button className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors text-sm">
            <Plus size={18} /> Создать
          </button>
          <button className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors text-sm">
            <ArrowRight size={18} /> Импорт
          </button>
        </div>

      </div>
    </div>
  );
}