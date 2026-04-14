import { useState, useEffect, useMemo } from "react";
import {
  Table as TableIcon,
  Search,
  Loader2,
  X,
  Database,
  Folder,
} from "lucide-react";
import { api } from "../../../services/api";

export function MwsSelectorModal({ isOpen, onClose, onSelectTable }) {
  const [spaces, setSpaces] = useState([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);
  const [tables, setTables] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isSpacesLoading, setIsSpacesLoading] = useState(false);
  const [isTablesLoading, setIsTablesLoading] = useState(false);

  // === ПУЛЕНЕПРОБИВАЕМЫЙ ЭКСТРАКТОР ===
  const extractArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.spaces)) return data.spaces;
    if (Array.isArray(data.nodes)) return data.nodes;
    if (typeof data === "object") {
      return data.results || data.data || data.spaces || data.nodes || [];
    }
    return [];
  };

  // 1. Загружаем пространства MWS
  useEffect(() => {
    if (!isOpen) return;

    const fetchSpaces = async () => {
      setIsSpacesLoading(true);
      try {
        const response = await api.getMwsSpaces();
        const spacesData = extractArray(response);
        setSpaces(spacesData || []); // Страховка

        if (spacesData && spacesData.length > 0 && !selectedSpaceId) {
          setSelectedSpaceId(spacesData[0].id);
        }
      } catch (error) {
        console.error("Ошибка загрузки пространств MWS:", error);
        setSpaces([]); // Сброс при ошибке
      } finally {
        setIsSpacesLoading(false);
      }
    };

    fetchSpaces();
  }, [isOpen, selectedSpaceId]);

  // 2. Загружаем таблицы
  useEffect(() => {
    if (!selectedSpaceId || !isOpen) return;

    const fetchTables = async () => {
      setIsTablesLoading(true);
      try {
        const response = await api.getMwsNodes(selectedSpaceId);
        const tablesData = extractArray(response);
        setTables(tablesData || []); // Страховка
      } catch (error) {
        console.error("Ошибка загрузки таблиц MWS:", error);
        setTables([]); // Сброс при ошибке
      } finally {
        setIsTablesLoading(false);
      }
    };

    fetchTables();
  }, [selectedSpaceId, isOpen]);

  // Фильтрация таблиц
  const filteredTables = useMemo(() => {
    if (!Array.isArray(tables)) return [];
    return tables.filter((table) =>
      table?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [tables, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#19191C]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Импорт из MWS Таблиц
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Выберите таблицу для вставки в документ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden bg-gray-50/30">
          {/* Левая колонка: Пространства */}
          <div className="w-1/3 border-r border-gray-100 bg-white overflow-y-auto p-4 space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
              Ваши пространства
            </div>

            {isSpacesLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="animate-spin text-gray-400" size={20} />
              </div>
            ) : !spaces || spaces.length === 0 ? (
              <p className="text-sm text-gray-500 px-2">
                Нет доступных пространств
              </p>
            ) : (
              (spaces || []).map((space) => (
                <button
                  key={space.id}
                  onClick={() => setSelectedSpaceId(space.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                    selectedSpaceId === space.id
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "text-gray-600 hover:bg-gray-50 font-medium"
                  }`}
                >
                  <Folder
                    size={16}
                    className={
                      selectedSpaceId === space.id
                        ? "text-indigo-500"
                        : "text-gray-400"
                    }
                  />
                  <span className="truncate">{space.name}</span>
                </button>
              ))
            )}
          </div>

          {/* Правая колонка: Таблицы */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            <div className="relative mb-6">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию таблицы..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition-all shadow-sm"
              />
            </div>

            {isTablesLoading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-sm font-medium">
                  Синхронизация с MWS...
                </span>
              </div>
            ) : !filteredTables || filteredTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-center">
                <TableIcon size={32} className="mb-3 opacity-20" />
                <span className="text-sm">
                  {searchQuery
                    ? "Таблицы не найдены"
                    : "В этом пространстве нет таблиц"}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {(filteredTables || []).map((table) => (
                  <button
                    key={table.id}
                    onClick={() => {
                      onSelectTable(table.id, table.name);
                      onClose();
                    }}
                    className="flex flex-col items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                      <TableIcon size={20} />
                    </div>
                    <div className="w-full">
                      <h4 className="text-sm font-bold text-gray-900 truncate w-full mb-1">
                        {table.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-mono truncate">
                        ID: {table.id}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
