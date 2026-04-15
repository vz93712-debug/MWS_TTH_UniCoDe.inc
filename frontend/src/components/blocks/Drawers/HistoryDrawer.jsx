import { useState, useEffect } from "react";
import { X, Clock, RotateCcw, User, Sparkles, Loader2 } from "lucide-react";
import { api } from "../../../services/api";

export function HistoryDrawer({ isOpen, onClose, pageId }) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Стейты для ИИ-анализа (explain-diff)
  const [aiStatus, setAiStatus] = useState("idle"); // idle, queued, processing, completed, error
  const [taskId, setTaskId] = useState(null);
  const [diffResult, setDiffResult] = useState(null);

  // 1. Загрузка реальной истории версий с бэкенда
  useEffect(() => {
    if (!isOpen || !pageId) return;

    const fetchVersions = async () => {
      setIsLoading(true);
      try {
        const response = await api.getPageVersions(pageId);
        // Подстраховка на случай не-массива (как мы делали раньше)
        let versionsData = [];
        if (Array.isArray(response)) versionsData = response;
        else if (response?.results) versionsData = response.results;
        else if (response?.data) versionsData = response.data;

        setVersions(versionsData);
      } catch (error) {
        console.error("Ошибка загрузки истории:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersions();
  }, [isOpen, pageId]);

  // 2. Поллинг задачи ИИ
  useEffect(() => {
    let intervalId;
    const pollTask = async () => {
      if (!taskId || aiStatus === "completed" || aiStatus === "error") return;
      try {
        const result = await api.checkTaskStatus(taskId);
        if (result.status === "completed") {
          setAiStatus("completed");
          setDiffResult(result.data); // Сохраняем результат анализа
          clearInterval(intervalId);
        } else if (result.status === "failed") {
          setAiStatus("error");
          clearInterval(intervalId);
        } else {
          setAiStatus(result.status);
        }
      } catch (e) {
        setAiStatus("error");
      }
    };

    if (taskId) intervalId = setInterval(pollTask, 2000);
    return () => clearInterval(intervalId);
  }, [taskId, aiStatus]);

  // Запуск ИИ-анализа
  const handleAnalyzeDiff = async () => {
    if (!pageId) return;
    setAiStatus("queued");
    setDiffResult(null);
    try {
      const res = await api.explainDiff(pageId);
      if (res.task_id) setTaskId(res.task_id);
      else throw new Error("Нет task_id");
    } catch (error) {
      console.error("Ошибка запуска explain-diff:", error);
      setAiStatus("error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[350px] bg-white border-l border-gray-200 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 font-sans">
      {/* Шапка */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
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

      {/* Блок ИИ Анализа */}
      <div className="p-5 border-b border-gray-100 bg-white shrink-0">
        {aiStatus === "idle" || aiStatus === "error" ? (
          <button
            onClick={handleAnalyzeDiff}
            className="w-full py-2.5 bg-[#19191C] hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Sparkles size={16} className="text-[#FF0032]" />
            AI-Анализ изменений
          </button>
        ) : aiStatus === "completed" && diffResult ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-[#FF0032]" />
              <span className="text-xs font-bold text-gray-500 uppercase">
                Сводка изменений
              </span>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {diffResult.summary}
            </p>
            {diffResult.compared && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-400 font-mono">
                {diffResult.compared}
              </div>
            )}
            <button
              onClick={() => setAiStatus("idle")}
              className="mt-3 text-xs text-[#FF0032] font-medium hover:underline w-full text-center"
            >
              Скрыть анализ
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="animate-spin text-[#FF0032]" />
            <span className="text-xs font-medium text-gray-600">
              {aiStatus === "queued"
                ? "Анализируем мировые линии..."
                : "ИИ изучает изменения..."}
            </span>
          </div>
        )}
        {aiStatus === "error" && (
          <p className="text-xs text-red-500 text-center mt-2 font-medium">
            Ошибка анализа. Попробуйте еще раз.
          </p>
        )}
      </div>

      {/* Таймлайн */}
      <div className="flex-1 overflow-y-auto p-5 relative">
        <div className="absolute left-[29px] top-5 bottom-5 w-px bg-gray-200 z-0"></div>

        <div className="space-y-6 relative z-10">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center bg-white py-4">
              Нет сохраненных версий
            </p>
          ) : (
            versions.map((version, index) => {
              const isCurrent = index === 0; // Считаем первую в списке текущей
              return (
                <div key={version.id || index} className="flex gap-4">
                  <div
                    className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 border-2 ${
                      isCurrent
                        ? "bg-[#FF0032] border-[#FF0032] shadow-[0_0_0_4px_rgba(255,0,50,0.1)]"
                        : "bg-white border-gray-300"
                    }`}
                  />
                  <div
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      isCurrent
                        ? "border-[#FF0032] bg-red-50/30"
                        : "border-gray-100 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-sm text-gray-900 mb-0.5">
                      {isCurrent
                        ? "Текущая версия"
                        : `Версия от ${new Date(version.created_at).toLocaleDateString()}`}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <div className="flex items-center gap-1.5">
                        <User size={12} />
                        <span>{version.author?.name || "Автор"}</span>
                      </div>
                      <span>
                        {new Date(version.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {!isCurrent && (
                      <button className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded hover:bg-gray-50 hover:text-[#FF0032] transition-colors">
                        <RotateCcw size={12} />
                        Восстановить
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
