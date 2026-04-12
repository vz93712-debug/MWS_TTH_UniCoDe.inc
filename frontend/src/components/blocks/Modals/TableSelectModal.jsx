import { useState } from 'react';
import { Search, Table as TableIcon, X } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';

const MOCK_TABLES = [
  { id: 1, name: 'Бэклог продукта MWS', rows: 124 },
  { id: 2, name: 'Смета проекта Q3', rows: 45 },
  { id: 3, name: 'База пользователей', rows: 1024 },
];

export function TableSelectModal({ isOpen, onClose }) {
  const [selected, setSelected] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#19191C]/40 backdrop-blur-[2px] p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
          <h2 className="text-lg font-bold text-gray-900">Вставить таблицу MWS</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[#E33A3A] transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Поиск */}
        <div className="p-4 bg-gray-50/50 border-b border-divider">
          <Input icon={<Search size={16} />} placeholder="Найти таблицу..." />
        </div>

        {/* Список таблиц */}
        <div className="p-2 max-h-[300px] overflow-y-auto">
          {MOCK_TABLES.map(table => (
            <button
              key={table.id}
              onClick={() => setSelected(table.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                selected === table.id 
                  ? 'bg-red-50 border border-red-200' 
                  : 'border border-transparent hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                selected === table.id ? 'bg-[#E33A3A] text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <TableIcon size={20} strokeWidth={selected === table.id ? 2.5 : 2} />
              </div>
              <div className="text-left">
                <p className={`text-[15px] font-medium ${selected === table.id ? 'text-red-900' : 'text-gray-900'}`}>
                  {table.name}
                </p>
                <p className="text-xs text-gray-500">{table.rows} строк</p>
              </div>
            </button>
          ))}
        </div>

        {/* Подвал с кнопками */}
        <div className="px-6 py-4 bg-gray-50 border-t border-divider flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          {/* Кнопка заблокирована, если не выбрана таблица */}
          <Button variant="primary" disabled={!selected}>Вставить</Button>
        </div>

      </div>
    </div>
  );
}