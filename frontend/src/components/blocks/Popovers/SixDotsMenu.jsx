import { Link2, Copy, CopyPlus, RefreshCw, Trash2 } from 'lucide-react';

// Вот это слово 'export' в начале самое главное!
export function SixDotsMenu() {
  const items = [
    { icon: Link2, label: 'Копировать ссылку на блок' },
    { icon: Copy, label: 'Копировать блок' },
    { icon: CopyPlus, label: 'Дублировать блок' },
    { icon: RefreshCw, label: 'Синхронизировать блок' },
  ];

  return (
    <div className="w-64 bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-1.5 font-sans flex flex-col gap-0.5">
      {items.map((item, idx) => (
        <button key={idx} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-3 text-gray-700 transition-colors">
          <div className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded text-gray-500 bg-white shadow-sm shrink-0">
            <item.icon size={14} />
          </div>
          {item.label}
        </button>
      ))}
      <div className="w-full h-px bg-gray-100 my-1" />
      <button className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 rounded-lg flex items-center gap-3 text-red-600 transition-colors">
        <div className="w-6 h-6 flex items-center justify-center border border-red-200 rounded text-red-500 bg-white shadow-sm shrink-0">
          <Trash2 size={14} />
        </div>
        Удалить блок
      </button>
    </div>
  );
}