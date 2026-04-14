import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Drawer } from "./Drawer";
import { api } from "../../services/api"; // Проверь путь до твоеного api.js

// Обрати внимание: я добавил pageId в пропсы, чтобы бэкенд знал, какой текст анализировать
export function AIAssistantDrawer({ isOpen, onClose, pageId }) {
  // Состояние сообщений (изначально только приветствие)
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Привет! Я твой AI-помощник MWS. Я прочитал этот документ, чем могу помочь?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Реф для автоматического скролла вниз
  const messagesEndRef = useRef(null);

  // Скроллим вниз каждый раз, когда меняется массив сообщений
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text = inputValue) => {
    if (!text.trim() || isLoading) return;

    // 1. Добавляем сообщение пользователя в UI
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // 2. Отправляем запрос на бэкенд вместе с ID текущей страницы
      const response = await api.askAssistant(pageId, text);

      // 3. Добавляем ответ ИИ
      // Предполагаем, что бэкенд возвращает JSON вида { "answer": "Текст ответа..." }
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: response.answer },
      ]);
    } catch (error) {
      console.error("Ошибка AI:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Ой, произошла ошибка связи с сервером. Бэкенд еще спит? Попробуй позже.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Отправка по нажатию Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="AI-Ассистент">
      <div className="flex flex-col h-full">
        {/* История чата */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Аватарка */}
              {msg.role === "ai" ? (
                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles size={16} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-gray-600 text-[10px] font-bold">
                  ВЫ
                </div>
              )}

              {/* Пузырь с текстом */}
              <div
                className={`shadow-sm p-4 text-sm text-gray-800 leading-relaxed max-w-[85%] ${
                  msg.role === "ai"
                    ? "bg-white border border-red-100 rounded-2xl rounded-tl-sm"
                    : "bg-gray-100 border border-gray-200 rounded-2xl rounded-tr-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Индикатор загрузки (когда ждем ответа от бэкенда) */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles size={16} />
              </div>
              <div className="bg-white border border-red-100 shadow-sm rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-red-500" />
                <span className="text-sm text-gray-500">
                  Читаю документы...
                </span>
              </div>
            </div>
          )}

          {/* Якорь для скролла */}
          <div ref={messagesEndRef} />
        </div>

        {/* Область ввода */}
        <div className="p-4 border-t border-gray-200 bg-white shrink-0">
          {/* Быстрые действия (Чипсы) */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            <button
              onClick={() =>
                handleSend(
                  "Сделай краткое саммари этого текста, выдели главные тезисы",
                )
              }
              disabled={isLoading}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#E33A3A] text-xs font-medium rounded-full whitespace-nowrap transition-colors border border-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={12} className="inline mr-1 mb-0.5" />
              Сделай саммари
            </button>
            <button
              onClick={() =>
                handleSend("Проверь текст на ошибки и предложи исправления")
              }
              disabled={isLoading}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium rounded-full whitespace-nowrap transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Проверь ошибки
            </button>
          </div>

          {/* Поле ввода */}
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Спроси о чем угодно..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-300 transition-all disabled:opacity-60"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
