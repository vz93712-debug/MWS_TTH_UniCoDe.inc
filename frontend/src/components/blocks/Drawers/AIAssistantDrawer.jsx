import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Drawer } from "./Drawer";
import { api } from "../../../services/api";

export function AIAssistantDrawer({ isOpen, onClose, pageId }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Привет! Я твой AI-помощник. Я прочитал этот документ, чем могу помочь?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // === СТЕЙТ ДЛЯ ИСТОРИИ ДИАЛОГА ===
  const [sessionId, setSessionId] = useState(null);

  const messagesEndRef = useRef(null);

  // Скроллим вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Сброс диалога при смене страницы
  useEffect(() => {
    setMessages([
      {
        role: "ai",
        content: "Привет! Я перечитал новый документ, о чем поговорим?",
      },
    ]);
    setSessionId(null);
  }, [pageId]);

  const handleSend = async (text = inputValue) => {
    if (!text.trim() || isLoading) return;

    // 1. Добавляем вопрос пользователя
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // 2. Отправляем запрос с session_id
      const response = await api.askAssistant(pageId, text, sessionId);

      // 3. Сохраняем ID сессии, чтобы ИИ помнил контекст
      if (response.session_id) {
        setSessionId(response.session_id);
      }

      // 4. Парсим ответ (теперь это поле response, а не answer!)
      const botResponseText =
        response.response || "Извини, я получил пустой ответ от сервера.";

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: botResponseText },
      ]);
    } catch (error) {
      console.error("Ошибка AI:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Ой, произошла ошибка связи с сервером. Попробуй еще раз.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="AI-Ассистент">
      <div className="flex flex-col h-full bg-gray-50/50">
        {/* История чата */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Аватарка */}
              {msg.role === "ai" ? (
                <div className="w-8 h-8 rounded-full bg-[#FF0032] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles size={16} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-gray-600 text-[10px] font-bold">
                  ВЫ
                </div>
              )}

              {/* Пузырь с текстом */}
              <div
                className={`shadow-sm p-4 text-[13px] leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                  msg.role === "ai"
                    ? "bg-white border border-red-100 text-gray-800 rounded-2xl rounded-tl-sm"
                    : "bg-gray-100 border border-gray-200 text-gray-800 rounded-2xl rounded-tr-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Лоадер генерации */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF0032] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles size={16} />
              </div>
              <div className="bg-white border border-red-100 shadow-sm rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-[#FF0032]" />
                <span className="text-[13px] text-gray-500 font-medium">
                  Думаю...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Область ввода */}
        <div className="p-4 border-t border-gray-200 bg-white shrink-0">
          {/* Подсказки */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            <button
              onClick={() =>
                handleSend("Выдели главные аспекты этого документа")
              }
              disabled={isLoading}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#FF0032] text-xs font-bold rounded-full whitespace-nowrap transition-colors border border-red-100 disabled:opacity-50"
            >
              <Sparkles size={12} className="inline mr-1 mb-0.5" />
              Сделай саммари
            </button>
            <button
              onClick={() =>
                handleSend("Проверь текст на ошибки и предложи исправления")
              }
              disabled={isLoading}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium rounded-full whitespace-nowrap transition-colors border border-gray-200 disabled:opacity-50"
            >
              Проверь ошибки
            </button>
          </div>

          {/* Инпут */}
          <div className="relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Спроси о чем угодно..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-[#FF0032] focus:ring-1 focus:ring-[#FF0032] transition-all disabled:opacity-60 resize-none h-11 min-h-[44px] max-h-[120px] overflow-hidden"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-1.5 top-1.5 w-8 h-8 flex items-center justify-center bg-[#19191C] hover:bg-gray-800 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
