import { useState } from "react";
import { X, Globe, Copy, ChevronDown } from "lucide-react";

// Выносим пользователей в константу для чистоты кода
const USERS = [
  {
    id: 1,
    name: "Коржик К.С",
    email: "korzikksenia.mws.ru",
    role: "Редактирование",
    initials: "K",
    color: "bg-[#FF0032]",
  },
  {
    id: 2,
    name: "Коржик К.С",
    email: "korzikksenia.mws.ru",
    role: "Чтение",
    initials: "K",
    color: "bg-[#4CAF50]",
  },
];

export function ShareModal({ isOpen, onClose }) {
  // Стейт для переключателя "Публичная ссылка"
  const [isPublic, setIsPublic] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[500px] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Шапка */}
        <div className="px-6 py-5 flex items-center justify-between">
          <h2 className="text-xl font-wide font-bold text-gray-900">
            Настройки доступа
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-2">
          {/* Публичная ссылка (Карточка) */}
          <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between mb-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50 text-gray-700">
                <Globe size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">
                  Публичная ссылка
                </h3>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  Любой в Интернете может просматривать
                </p>
              </div>
            </div>

            {/* Анимированный Toggle */}
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${
                isPublic ? "bg-[#FF0032]" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${
                  isPublic ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Список пользователей */}
          <h4 className="text-[14px] font-bold text-gray-900 mb-3">
            Имеют доступ
          </h4>

          <div className="space-y-3">
            {USERS.map((user) => (
              <div
                key={user.id}
                className="border border-gray-200 rounded-2xl p-3 flex items-center justify-between shadow-sm hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Аватар */}
                  <div
                    className={`w-11 h-11 rounded-full ${user.color} text-white flex items-center justify-center font-bold text-lg`}
                  >
                    {user.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {user.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                  </div>
                </div>

                {/* Кастомный селект */}
                <div className="relative">
                  <select
                    defaultValue={user.role}
                    className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer font-medium appearance-none pr-6 py-1 z-10 relative"
                  >
                    <option value="Редактирование">Редактирование</option>
                    <option value="Чтение">Чтение</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="text-gray-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Подвал с кнопками */}
        <div className="px-6 py-6 bg-white flex justify-between gap-4 mt-2">
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-[#FF0032] bg-white border border-[#FF0032] hover:bg-[#FFEBED] rounded-xl transition-colors">
            <Copy size={16} /> Копировать ссылку
          </button>
          <button
            onClick={onClose}
            className="px-8 py-2.5 text-sm font-wide font-bold text-white bg-[#FF0032] hover:bg-[#CC0028] rounded-xl transition-colors shadow-sm"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
