import {
  X,
  Database,
  Search,
  Table as TableIcon,
  LayoutGrid,
} from "lucide-react";
import { useState } from "react";

// ДОБАВИЛИ ПРОП onSelect
export function TableSelectModal({ isOpen, onClose, onSelect }) {
  const [searchQuery, setSearchQuery] = useState("");

  const mockDatabases = [
    { id: "1", name: "Проекты и задачи (Спринт 4)", type: "kanban", count: 24 },
    { id: "2", name: "Сотрудники отдела", type: "table", count: 145 },
    { id: "3", name: "Бэклог продукта", type: "table", count: 89 },
    { id: "4", name: "CRM: Клиенты B2B", type: "table", count: 1250 },
  ];

  // ЛОГИКА ПОИСКА: Фильтруем массив на лету
  const filteredDatabases = mockDatabases.filter((db) =>
    db.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all">
        {/* Шапка */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#E33A3A]">
              <Database size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Импорт из MWS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Поиск */}
        <div className="px-6 py-4 border-b border-gray-50">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Поиск по базам данных..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#E33A3A] focus:ring-1 focus:ring-[#E33A3A] transition-all"
            />
          </div>
        </div>

        {/* Список таблиц */}
        <div className="px-3 py-3 max-h-[300px] overflow-y-auto">
          <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Ваши базы данных
          </h3>

          <div className="space-y-1">
            {filteredDatabases.length > 0 ? (
              filteredDatabases.map((db) => (
                <button
                  key={db.id}
                  onClick={() => {
                    // ПЕРЕДАЕМ ДАННЫЕ НАВЕРХ И ЗАКРЫВАЕМ
                    if (onSelect) onSelect(db.id, db.name);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400 group-hover:text-[#E33A3A] transition-colors">
                      {db.type === "kanban" ? (
                        <LayoutGrid size={18} />
                      ) : (
                        <TableIcon size={18} />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {db.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {db.type === "kanban" ? "Канбан-доска" : "Таблица"}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                    {db.count} строк
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-gray-400">
                Таблицы не найдены
              </div>
            )}
          </div>
        </div>

        {/* Подвал */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
          >
            Отмена
          </button>
          <button
            onClick={() => {
              // ПЕРЕДАЕМ СИГНАЛ О СОЗДАНИИ НОВОЙ БАЗЫ
              if (onSelect) onSelect("new", "Новая локальная база");
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-[#E33A3A] hover:bg-[#CC3434] rounded-lg transition-colors shadow-sm"
          >
            Создать новую
          </button>
        </div>
      </div>
    </div>
  );
}
