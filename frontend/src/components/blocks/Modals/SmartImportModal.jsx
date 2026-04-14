import { useState, useEffect } from "react";
import { X, UploadCloud, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "../../../services/api";

export function SmartImportModal({
  isOpen,
  onClose,
  currentSpaceId,
  onImportSuccess,
}) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("idle"); // idle, uploading, queued, processing, completed, error
  const [taskId, setTaskId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Очистка при закрытии
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setContent("");
        setStatus("idle");
        setTaskId(null);
        setErrorMessage("");
      }, 0);
    }
  }, [isOpen]);

  // Механизм Polling (Опрос сервера)
  useEffect(() => {
    let intervalId;

    const pollTask = async () => {
      if (!taskId || status === "completed" || status === "error") return;

      try {
        const result = await api.checkTaskStatus(taskId);

        if (result.status === "completed") {
          setStatus("completed");
          // Бэкенд возвращает page_id созданной страницы
          setTimeout(() => {
            onImportSuccess(result.page_id);
            onClose();
          }, 1500); // Даем юзеру секунду полюбоваться галочкой успеха
        } else if (result.status === "failed") {
          setStatus("error");
          setErrorMessage(result.error?.message || "Ошибка при обработке ИИ");
        } else {
          // queued или processing — просто обновляем статус для UI
          setStatus(result.status);
        }
      } catch (error) {
        console.error("Ошибка опроса задачи:", error);
        setStatus("error");
        setErrorMessage("Потеряна связь с сервером");
      }
    };

    if (taskId) {
      intervalId = setInterval(pollTask, 2000); // Опрашиваем каждые 2 секунды
    }

    return () => clearInterval(intervalId);
  }, [taskId, status, onClose, onImportSuccess]);

  const handleImport = async () => {
    if (!content.trim() || !currentSpaceId) return;

    setStatus("uploading");
    try {
      // 1. Отправляем текст на импорт
      const response = await api.smartImport(
        content,
        "markdown",
        currentSpaceId,
        "Импортированный документ",
      );

      // 2. Получаем ID задачи и запускаем поллинг
      if (response.task_id) {
        setTaskId(response.task_id);
        setStatus("queued");
      }
    } catch (error) {
      console.error("Ошибка старта импорта:", error);
      setStatus("error");
      setErrorMessage("Не удалось запустить импорт");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#19191C]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
              <UploadCloud size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Умный AI-Импорт
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Превратите текст в структуру Lexical
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={status !== "idle" && status !== "error"}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-xl transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 bg-gray-50/50">
          {status === "idle" || status === "error" ? (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Вставьте сюда ваш Markdown или обычный текст..."
                className="w-full h-48 p-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF0032] focus:ring-1 focus:ring-[#FF0032] resize-none shadow-sm mb-2"
              />
              {status === "error" && (
                <p className="text-xs text-red-500 font-medium mb-3 text-center">
                  {errorMessage}
                </p>
              )}
              <button
                onClick={handleImport}
                disabled={!content.trim()}
                className="w-full py-3 bg-[#19191C] hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Начать импорт
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              {status === "completed" ? (
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-2 animate-in zoom-in">
                  <CheckCircle2 size={32} />
                </div>
              ) : (
                <Loader2
                  size={40}
                  className="animate-spin text-[#FF0032] mb-2"
                />
              )}

              <div className="text-center">
                <h4 className="font-bold text-gray-900 text-lg">
                  {status === "uploading" && "Отправка данных..."}
                  {status === "queued" && "В очереди у ИИ..."}
                  {status === "processing" && "ИИ собирает страницу..."}
                  {status === "completed" && "Готово!"}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {status !== "completed"
                    ? "Пожалуйста, не закрывайте окно."
                    : "Открываем новый документ..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
