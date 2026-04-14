import { X, Clock, RotateCcw, User } from "lucide-react";

export function HistoryDrawer({ isOpen, onClose }) {
  // Моковые данные для истории (СКВ)
  const historyLog = [
    {
      id: 1,
      action: "Текущая версия",
      time: "Сейчас",
      author: "Я",
      isCurrent: true,
    },
    {
      id: 2,
      action: "Добавлена таблица «Задачи»",
      time: "Сегодня, 11:20",
      author: "Алексей С.",
      isCurrent: false,
    },
    {
      id: 3,
      action: "Изменена структура заголовков",
      time: "Вчера, 16:45",
      author: "Мария К.",
      isCurrent: false,
    },
    {
      id: 4,
      action: "Документ создан",
      time: "Вчера, 12:00",
      author: "Алексей С.",
      isCurrent: false,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 font-sans">
      {/* Шапка */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2 text-gray-900">
          <Clock size={18} className="text-[#FF0032]" />
          <h3 className="font-bold text-lg">История версий</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded-md text-gray-500 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Таймлайн */}
      <div className="flex-1 overflow-y-auto p-5 relative">
        <div className="absolute left-[29px] top-6 bottom-6 w-px bg-gray-200 z-0"></div>

        <div className="space-y-6 relative z-10">
          {historyLog.map((log) => (
            <div key={log.id} className="flex gap-4">
              <div
                className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 border-2 ${
                  log.isCurrent
                    ? "bg-[#FF0032] border-[#FF0032] shadow-[0_0_0_4px_rgba(255,0,50,0.1)]"
                    : "bg-white border-gray-300"
                }`}
              />

              <div
                className={`flex-1 p-3 rounded-lg border transition-all ${
                  log.isCurrent
                    ? "border-[#FF0032] bg-red-50/30"
                    : "border-gray-100 bg-white hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-sm text-gray-900 mb-0.5">
                  {log.action}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                  <div className="flex items-center gap-1.5">
                    <User size={12} />
                    <span>{log.author}</span>
                  </div>
                  <span>{log.time}</span>
                </div>

                {!log.isCurrent && (
                  <button className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded hover:bg-gray-50 hover:text-[#FF0032] transition-colors">
                    <RotateCcw size={12} />
                    Восстановить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
