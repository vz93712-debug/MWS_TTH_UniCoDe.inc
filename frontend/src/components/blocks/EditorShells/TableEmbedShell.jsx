import { useState } from 'react';
import { 
  Table, BarChart2, Kanban, Plus, Filter, 
  ArrowUpDown, EyeOff, MoreHorizontal, AlignLeft, Calendar 
} from 'lucide-react';
import { ViewTypeMenu } from '../Popovers/ViewTypeMenu';
import { Badge } from '../../ui/Badge';
import { Avatar } from '../../ui/Avatar';

export function TableEmbedShell() {
  // Добавили 'kanban' в возможные состояния
  const [activeTab, setActiveTab] = useState('table'); 
  const [showViewMenu, setShowViewMenu] = useState(false);

  return (
    <div className="w-full max-w-5xl font-sans mt-8">
      
      {/* 1. ПАНЕЛЬ ВКЛАДОК */}
      <div className="flex items-center gap-2 mb-4 relative">
        <button 
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
            activeTab === 'table' ? 'bg-red-50 text-[#E33A3A] border-red-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Table size={16} /> Таблица
        </button>

        <button 
          onClick={() => setActiveTab('chart')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
            activeTab === 'chart' ? 'bg-red-50 text-[#E33A3A] border-red-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <BarChart2 size={16} /> Диаграмма
        </button>

        {/* НОВАЯ ВКЛАДКА: Канбан */}
        <button 
          onClick={() => setActiveTab('kanban')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
            activeTab === 'kanban' ? 'bg-red-50 text-[#E33A3A] border-red-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Kanban size={16} /> Канбан
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Кнопка + с тултипом и меню */}
        <div className="relative group">
          <button 
            onClick={() => setShowViewMenu(!showViewMenu)}
            className="p-1.5 text-gray-400 hover:text-[#E33A3A] hover:bg-red-50 rounded transition-colors"
          >
            <Plus size={18} />
          </button>
          
          <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[11px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-40">
            Новое представление
          </div>

          {showViewMenu && (
            <div className="absolute top-full left-0 mt-2 z-50">
              <ViewTypeMenu />
            </div>
          )}
        </div>
      </div>

      {/* 2. РЕНДЕР КОНТЕНТА */}
      {activeTab === 'table' && <TableView />}
      {activeTab === 'chart' && <ChartView />}
      {activeTab === 'kanban' && <KanbanView />}
      
    </div>
  );
}

// === ВНУТРЕННИЕ КОМПОНЕНТЫ ПРЕДСТАВЛЕНИЙ ===

function TableView() {
  return (
    <div className="mt-2 w-full overflow-x-auto pb-4">
      <table className="w-full text-left border-collapse text-[14px] text-[#19191C]">
        <thead className="bg-gray-50/80">
          <tr>
            <th className="border border-gray-200 px-4 py-2 font-medium text-gray-600 font-sans w-12 text-center">#</th>
            <th className="border border-gray-200 px-4 py-2 font-medium text-gray-600 font-sans w-1/4">Метод</th>
            <th className="border border-gray-200 px-4 py-2 font-medium text-gray-600 font-sans w-1/4">Путь</th>
            <th className="border border-gray-200 px-4 py-2 font-medium text-gray-600 font-sans">Описание</th>
            <th className="border-y border-r border-gray-200 px-2 py-2 w-10 text-center text-gray-400 hover:bg-gray-200 cursor-pointer transition-colors">
              <Plus size={16} className="mx-auto" />
            </th>
          </tr>
        </thead>
        <tbody className="align-top">
          <tr className="hover:bg-gray-50/50 transition-colors group">
            <td className="border border-gray-200 px-4 py-2 text-gray-400 text-center select-none">1</td>
            <td className="border border-gray-200 px-4 py-2 font-mono text-[13px]">GET</td>
            <td className="border border-gray-200 px-4 py-2 font-mono text-[13px]">/api/v1/users/me/</td>
            <td className="border border-gray-200 px-4 py-2 leading-relaxed">Профиль текущего пользователя.</td>
            <td className="border-y border-r border-gray-200 bg-gray-50/30"></td>
          </tr>
          <tr>
            <td colSpan={5} className="border-x border-b border-gray-200 px-4 py-2 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-700 cursor-pointer transition-colors">
              <div className="flex items-center gap-2"><Plus size={16} /><span>Добавить строку</span></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ChartView() {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-gray-200 p-8 pt-10">
      <div className="relative h-64 border-l border-gray-200 ml-8 flex flex-col justify-between pb-8">
        {[1, 0.8, 0.6, 0.4, 0.2, 0].map((val) => (
          <div key={val} className="w-full border-t border-gray-100 flex items-center relative">
            <span className="absolute -left-8 text-xs font-medium text-gray-500 w-6 text-right">{val === 0 ? '0' : val.toString().replace('.', ',')}</span>
          </div>
        ))}
        <div className="absolute inset-0 bottom-8 flex items-end justify-center gap-16 px-10">
          <div className="w-24 h-[50%] bg-red-100 border border-red-300 relative flex justify-center group"><span className="absolute -bottom-6 text-xs font-medium text-gray-600">Q1</span></div>
          <div className="w-24 h-[90%] bg-indigo-100 border border-indigo-300 relative flex justify-center"><span className="absolute -bottom-6 text-xs font-medium text-gray-600">Q2</span></div>
        </div>
      </div>
    </div>
  );
}

// === НОВЫЙ КОМПОНЕНТ: КАНБАН ===

const KANBAN_DATA = [
  {
    id: 'todo',
    title: 'К выполнению',
    color: 'bg-gray-400',
    count: 2,
    cards: [
      { id: 1, title: 'Спроектировать API Gateway', tags: [{ label: 'Бэкенд', color: 'blue' }], date: '15 апр', user: 'КА', initials: 'К' },
      { id: 2, title: 'Подготовить моки для UI Kit', tags: [{ label: 'Дизайн', color: 'green' }], date: '16 апр', user: 'АВ', initials: 'А' },
    ]
  },
  {
    id: 'in-progress',
    title: 'В работе',
    color: 'bg-blue-500',
    count: 1,
    cards: [
      { id: 3, title: 'Верстка Kanban-доски в стиле МТС', tags: [{ label: 'Фронтенд', color: 'red' }, { label: 'Срочно', color: 'red' }], date: 'Сегодня', user: 'КА', initials: 'К' },
    ]
  },
  {
    id: 'done',
    title: 'Готово',
    color: 'bg-green-500',
    count: 2,
    cards: [
      { id: 4, title: 'Интеграция шрифтов MTS Compact/Wide', tags: [{ label: 'Дизайн', color: 'green' }], date: 'Вчера', user: 'АВ', initials: 'А' },
      { id: 5, title: 'Slash-меню и Тулбары', tags: [{ label: 'Фронтенд', color: 'blue' }], date: 'Вчера', user: 'КА', initials: 'К' },
    ]
  }
];

function KanbanView() {
  return (
    <div className="mt-2 flex gap-4 overflow-x-auto pb-4 items-start snap-x">
      {KANBAN_DATA.map((column) => (
        <div key={column.id} className="w-[280px] shrink-0 bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col snap-start">
          
          {/* Шапка колонки */}
          <div className="p-3 flex items-center justify-between group cursor-pointer border-b border-gray-200/50">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${column.color}`} />
              <h3 className="font-semibold text-sm text-gray-900">{column.title}</h3>
              <span className="text-xs font-medium text-gray-400 bg-gray-200/50 px-1.5 rounded">{column.count}</span>
            </div>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 text-gray-400 hover:text-gray-700 rounded"><Plus size={14} /></button>
              <button className="p-1 text-gray-400 hover:text-gray-700 rounded"><MoreHorizontal size={14} /></button>
            </div>
          </div>

          {/* Карточки */}
          <div className="p-2 flex flex-col gap-2 min-h-[150px]">
            {column.cards.map((card) => (
              <div 
                key={card.id} 
                className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-[#E33A3A] hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
              >
                {/* Теги */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {card.tags.map((tag, idx) => (
                    <Badge key={idx} color={tag.color}>{tag.label}</Badge>
                  ))}
                </div>
                
                {/* Заголовок карточки */}
                <p className="text-[13px] font-medium text-gray-900 leading-snug mb-3">
                  {card.title}
                </p>
                
                {/* Подвал карточки (Дата, иконки, Аватар) */}
                <div className="flex items-center justify-between text-gray-400">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                      <Calendar size={12} /> {card.date}
                    </span>
                    <AlignLeft size={12} className="hover:text-gray-700 transition-colors" />
                  </div>
                  <Avatar initials={card.initials} size="sm" colorClass={card.user === 'КА' ? 'bg-[#E33A3A]' : 'bg-green-600'} />
                </div>
              </div>
            ))}
            
            {/* Кнопка добавления внизу колонки */}
            <button className="flex items-center gap-2 py-2 px-2 text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors mt-1">
              <Plus size={16} /> Создать
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}