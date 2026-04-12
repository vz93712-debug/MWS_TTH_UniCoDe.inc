import { LayoutTemplate, CalendarDays, BarChart2, AlignLeft, Kanban, FileText } from 'lucide-react';

const VIEW_TYPES = [
  { id: 'arch', icon: LayoutTemplate, label: 'Архитектура' },
  { id: 'calendar', icon: CalendarDays, label: 'Календарь' },
  { id: 'chart', icon: BarChart2, label: 'Диаграмма' },
  { id: 'gantt', icon: AlignLeft, label: 'Диаграмма Ганта' },
  { id: 'kanban', icon: Kanban, label: 'Канбан-доска' },
  { id: 'form', icon: FileText, label: 'Форма' },
];

export function ViewTypeMenu() {
  return (
    <div className="w-56 bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-2 font-sans flex flex-col gap-0.5 z-50">
      {VIEW_TYPES.map((item) => (
        <button
          key={item.id}
          className="w-[calc(100%-16px)] mx-auto flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
        >
          <div className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded text-gray-500 bg-white shadow-sm shrink-0">
            <item.icon size={14} />
          </div>
          <span className="font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}